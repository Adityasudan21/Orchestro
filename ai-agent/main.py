import json
import logging
import os
import shutil

from confluent_kafka import Consumer, KafkaError

from agent import run_claude_agent
from git_ops import clone_and_checkout, commit_and_push, create_pr
from orchestro import update_task_status

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger(__name__)

CONSUMER_CONFIG = {
    "bootstrap.servers": os.environ["KAFKA_BOOTSTRAP_SERVERS"],
    "group.id": "ai-agent-group",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
    # Allow up to 30 min per ticket before the broker considers the consumer dead.
    "max.poll.interval.ms": 1800000,
    "session.timeout.ms": 45000,
    "heartbeat.interval.ms": 10000,
}


def process_ticket(payload: dict) -> bool:
    task_id = payload["taskId"]
    title = payload.get("title", "")
    description = payload.get("description") or ""
    git_link = payload.get("gitLink") or ""
    branch = payload.get("branch") or ""
    ai_branch = f"ai/task-{task_id}"

    if not git_link or not branch:
        log.error("Task %s missing gitLink or branch — cannot proceed", task_id)
        update_task_status(task_id, "NEEDS_MORE_INFO")
        return False

    repo_path = None
    try:
        repo_path = clone_and_checkout(git_link, branch, ai_branch)
    except Exception as e:
        log.error("Git clone failed for task %s: %s", task_id, e)
        update_task_status(task_id, "NEEDS_MORE_INFO")
        return False

    try:
        try:
            run_claude_agent(repo_path, title, description)
        except Exception as e:
            log.error("Claude agent failed for task %s: %s", task_id, e)
            update_task_status(task_id, "NEEDS_MORE_INFO")
            return False

        try:
            changed = commit_and_push(repo_path, task_id, ai_branch)
            if not changed:
                update_task_status(task_id, "NEEDS_MORE_INFO")
                return False
            create_pr(git_link, ai_branch, branch, title, task_id)
            update_task_status(task_id, "IN_REVIEW")
            return True
        except Exception as e:
            log.error("Git push/PR failed for task %s: %s", task_id, e)
            update_task_status(task_id, "NEEDS_MORE_INFO")
            return False
    finally:
        if repo_path:
            shutil.rmtree(repo_path, ignore_errors=True)


def run() -> None:
    consumer = Consumer(CONSUMER_CONFIG)
    consumer.subscribe(["ai-ticket-queue"])
    log.info("AI Agent started — waiting for tickets on 'ai-ticket-queue'")

    while True:
        msg = consumer.poll(timeout=5.0)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() != KafkaError._PARTITION_EOF:
                log.error("Kafka error: %s", msg.error())
            continue

        try:
            payload = json.loads(msg.value().decode("utf-8"))
            log.info("Received ticket taskId=%s", payload.get("taskId"))
            process_ticket(payload)
        except Exception as e:
            log.exception("Unhandled error processing message: %s", e)
        finally:
            # Commit only after processing completes — this is what makes the queue sequential.
            # If the container crashes before this, the same message is re-delivered on restart.
            consumer.commit(message=msg, asynchronous=False)


if __name__ == "__main__":
    run()

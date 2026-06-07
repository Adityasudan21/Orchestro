import logging
import os

import requests

log = logging.getLogger(__name__)

ORCHESTRO_BASE_URL = os.environ["ORCHESTRO_BASE_URL"]
AGENT_USER = os.environ["ORCHESTRO_AGENT_USER"]
AGENT_PASS = os.environ["ORCHESTRO_AGENT_PASS"]


def update_task_status(task_id: int, status: str) -> None:
    url = f"{ORCHESTRO_BASE_URL}/api/tasks/{task_id}/status"
    try:
        resp = requests.patch(
            url,
            json={"status": status},
            auth=(AGENT_USER, AGENT_PASS),
            timeout=10,
        )
        resp.raise_for_status()
        log.info("Updated task %s to %s", task_id, status)
    except Exception as e:
        log.error("Failed to update task %s status to %s: %s", task_id, status, e)

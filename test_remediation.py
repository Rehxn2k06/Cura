from remediation.remediation import RemediationEngine
import json

remediator = RemediationEngine(dry_run=False)
result = remediator.execute({
    "action": "restart_pod",
    "target_service": "database-service",
    "confidence": 0.99
})

print("Test Result:")
print(json.dumps(result, indent=2))

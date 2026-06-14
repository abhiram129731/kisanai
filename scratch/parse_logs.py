import json

log_path = r"C:\Users\P abhiram\.gemini\antigravity-ide\brain\ec866b88-d22e-446a-ab22-44a2b57f1640\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Find the browser subagent's execution step
            if data.get("type") == "BROWSER_SUBAGENT":
                print("Found BROWSER_SUBAGENT step!")
                content = data.get("content", "")
                # Print lines containing "community" or "console" or "error" or "crash"
                lines = content.split("\n")
                for l in lines:
                    if any(w in l.lower() for w in ["community", "console", "error", "crash", "uncaught", "exception"]):
                        print(l)
        except Exception as e:
            pass

import json

log_path = r"C:\Users\P abhiram\.gemini\antigravity-ide\brain\ec866b88-d22e-446a-ab22-44a2b57f1640\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("step_index") == 1360:
                content = data.get("content", "")
                print("Total content length:", len(content))
                print("Last 3000 characters of content:")
                print(content[-3000:])
                break
        except Exception as e:
            pass

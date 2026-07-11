import os
import re

dir_path = r"C:\Users\srika\.gemini\antigravity\scratch\guardianpulse"

for root, dirs, files in os.walk(dir_path):
    for filename in files:
        if filename.endswith(('.js', '.html', '.json', '.md')):
            file_path = os.path.join(root, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            
            # Specific HTML tag replacements
            new_content = new_content.replace('Guardian<span class="logo-accent">Pulse</span>', 'resQ<span class="logo-accent">paws</span>')
            new_content = new_content.replace('Guardian<span style="color:#22C55E;">Pulse</span>', 'resQ<span style="color:#22C55E;">paws</span>')
            
            # Email replacements
            new_content = new_content.replace('emergency@guardianpulse.org', 'emergency@resqpaws.org')
            new_content = new_content.replace('info@guardianpulse.org', 'info@resqpaws.org')
            
            # General text replacements using regex to avoid 'window.GuardianPulse'
            new_content = re.sub(r'(?<!window\.)GuardianPulse', 'resQpaws', new_content)
            new_content = re.sub(r'(?<!window\.)guardianpulse', 'resqpaws', new_content)
            new_content = new_content.replace('Guardian Pulse', 'resQpaws')
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {file_path}")

print("Done")

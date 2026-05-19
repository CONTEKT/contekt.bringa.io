import re

path_d = "M3462 6218 c-9 -9 -12 -115 -12 -416 l0 -405 58 6 c31 4 98 12 147 18 50 6 205 14 345 18 l255 6 5 147 c3 80 8 150 12 153 27 27 63 1 332 -241 195 -176 276 -254 276 -269 0 -15 -80 -93 -276 -268 -276 -247 -305 -267 -332 -234 -7 8 -13 72 -14 158 l-3 144 -137 -2 c-180 -3 -293 -27 -415 -88 -227 -115 -365 -326 -412 -635 -11 -68 -10 -76 6 -88 15 -10 155 -12 743 -9 795 4 775 3 915 66 166 76 290 222 330 393 51 215 -34 427 -220 550 l-64 42 54 58 c30 32 70 91 89 130 99 201 56 420 -114 590 -93 94 -201 151 -326 173 -107 19 -1223 22 -1242 3z"

# Extract all numeric pairs
coords = [float(x) for x in re.findall(r'-?\d+', path_d)]

# We need to simulate the relative and absolute path commands.
x_min, x_max = float('inf'), float('-inf')
y_min, y_max = float('inf'), float('-inf')

current_x, current_y = 0.0, 0.0
# Simplistic parser: Since the path has M, c, l, we will just parse it
import string

commands = re.findall(r'([A-Za-z])|(-?\d+)', path_d)
tokens = []
for letter, num in commands:
    if letter:
        tokens.append(letter)
    else:
        tokens.append(float(num))

i = 0
current_cmd = ''
while i < len(tokens):
    t = tokens[i]
    if isinstance(t, str):
        current_cmd = t
        i += 1
        continue
    
    # Process coordinates based on command
    if current_cmd == 'M':
        current_x = tokens[i]
        current_y = tokens[i+1]
        i += 2
    elif current_cmd == 'm':
        current_x += tokens[i]
        current_y += tokens[i+1]
        i += 2
    elif current_cmd == 'c':
        # relative bezier curve: 6 coordinates
        # to approximate bounds, we just add the control points and endpoint to bbox
        cx1, cy1 = current_x + tokens[i], current_y + tokens[i+1]
        cx2, cy2 = current_x + tokens[i+2], current_y + tokens[i+3]
        current_x += tokens[i+4]
        current_y += tokens[i+5]
        i += 6
        x_min = min(x_min, cx1, cx2)
        x_max = max(x_max, cx1, cx2)
        y_min = min(y_min, cy1, cy2)
        y_max = max(y_max, cy1, cy2)
    elif current_cmd == 'l':
        current_x += tokens[i]
        current_y += tokens[i+1]
        i += 2
    elif current_cmd == 'z' or current_cmd == 'Z':
        # do nothing
        pass
        
    x_min = min(x_min, current_x)
    x_max = max(x_max, current_x)
    y_min = min(y_min, current_y)
    y_max = max(y_max, current_y)

print(f"BBox: X=[{x_min}, {x_max}], Y=[{y_min}, {y_max}]")

# apply transform
# transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)"
sx_min = x_min * 0.1
sx_max = x_max * 0.1
sy_min = 1024.0 - y_max * 0.1
sy_max = 1024.0 - y_min * 0.1

print(f"Scaled BBox: X=[{sx_min}, {sx_max}], Y=[{sy_min}, {sy_max}]")

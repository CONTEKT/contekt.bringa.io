import xml.etree.ElementTree as ET
import re

tree = ET.parse('public/Bringa_logo.svg')
root = tree.getroot()
paths = root.findall('.//{http://www.w3.org/2000/svg}path')

# We want path 0 and 2
d_str = paths[0].attrib['d'] + " " + paths[2].attrib['d']

# Find all coordinates (pairs of x, y after commands)
# Just find all numbers
nums = [float(x) for x in re.findall(r'-?\d+', d_str)]

# Since commands are absolute and relative, it's hard to get exact bbox without a real SVG parser.
# Let's just use an SVG parsing library if available, or write a quick approximation.

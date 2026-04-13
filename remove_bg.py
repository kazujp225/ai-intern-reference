from rembg import remove
from PIL import Image
import sys
import glob

if len(sys.argv) > 1:
    pattern = sys.argv[1]
    for filename in glob.glob(pattern):
        print(f"Processing {filename}...")
        try:
            with Image.open(filename) as input_image:
                output_image = remove(input_image)
            output_image.save(filename)
        except Exception as e:
            print(f"Error on {filename}: {e}")

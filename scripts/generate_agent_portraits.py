from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


SIZE = (720, 960)
W, H = SIZE


AGENTS = {
    "haru": {
        "bg": ((36, 18, 29), (132, 74, 86)),
        "accent": (255, 154, 127),
        "hair": (104, 92, 142),
        "hair_shadow": (58, 45, 78),
        "hair_highlight": (171, 157, 217),
        "skin": (247, 224, 216),
        "eye": (118, 196, 255),
        "outfit": (43, 34, 50),
        "outfit_light": (84, 67, 95),
        "hair_style": "commander",
        "accessory": "earring",
        "mood": "spark",
    },
    "hiyori": {
        "bg": ((25, 18, 32), (95, 78, 113)),
        "accent": (255, 226, 173),
        "hair": (238, 219, 164),
        "hair_shadow": (176, 150, 116),
        "hair_highlight": (255, 244, 212),
        "skin": (248, 225, 214),
        "eye": (164, 212, 255),
        "outfit": (56, 45, 74),
        "outfit_light": (98, 81, 122),
        "hair_style": "soft_long",
        "accessory": "clip",
        "mood": "petals",
    },
    "mao": {
        "bg": ((42, 28, 59), (122, 82, 165)),
        "accent": (255, 206, 108),
        "hair": (243, 176, 100),
        "hair_shadow": (187, 115, 56),
        "hair_highlight": (255, 220, 153),
        "skin": (248, 224, 212),
        "eye": (93, 165, 255),
        "outfit": (63, 40, 91),
        "outfit_light": (102, 73, 136),
        "hair_style": "mage_bob",
        "accessory": "hat",
        "mood": "stars",
    },
    "mark": {
        "bg": ((18, 25, 39), (55, 86, 116)),
        "accent": (132, 215, 255),
        "hair": (182, 186, 210),
        "hair_shadow": (118, 126, 149),
        "hair_highlight": (228, 232, 246),
        "skin": (243, 220, 210),
        "eye": (139, 183, 228),
        "outfit": (26, 36, 55),
        "outfit_light": (66, 84, 110),
        "hair_style": "silver_sharp",
        "accessory": "glasses",
        "mood": "grid",
    },
    "natori": {
        "bg": ((31, 24, 43), (122, 103, 157)),
        "accent": (255, 190, 220),
        "hair": (101, 126, 203),
        "hair_shadow": (61, 74, 132),
        "hair_highlight": (163, 182, 255),
        "skin": (248, 223, 211),
        "eye": (170, 218, 255),
        "outfit": (74, 58, 113),
        "outfit_light": (119, 99, 166),
        "hair_style": "soft_wave",
        "accessory": "scarf",
        "mood": "petals",
    },
    "ren": {
        "bg": ((17, 26, 37), (42, 101, 122)),
        "accent": (101, 227, 214),
        "hair": (63, 77, 98),
        "hair_shadow": (32, 39, 55),
        "hair_highlight": (131, 151, 178),
        "skin": (244, 221, 210),
        "eye": (118, 244, 220),
        "outfit": (24, 35, 43),
        "outfit_light": (59, 84, 95),
        "hair_style": "tech_long",
        "accessory": "headset",
        "mood": "grid",
    },
    "rice": {
        "bg": ((28, 22, 30), (94, 73, 85)),
        "accent": (255, 220, 164),
        "hair": (238, 233, 222),
        "hair_shadow": (187, 177, 167),
        "hair_highlight": (255, 249, 241),
        "skin": (246, 222, 210),
        "eye": (166, 203, 255),
        "outfit": (78, 59, 54),
        "outfit_light": (119, 92, 82),
        "hair_style": "classic_long",
        "accessory": "brooch",
        "mood": "spark",
    },
    "shizuku": {
        "bg": ((20, 14, 31), (83, 50, 118)),
        "accent": (207, 125, 255),
        "hair": (61, 52, 87),
        "hair_shadow": (31, 28, 45),
        "hair_highlight": (117, 105, 165),
        "skin": (244, 217, 210),
        "eye": (214, 134, 255),
        "outfit": (28, 21, 42),
        "outfit_light": (63, 49, 92),
        "hair_style": "gothic_tails",
        "accessory": "ribbon",
        "mood": "moon",
    },
    "wanko": {
        "bg": ((29, 18, 24), (148, 70, 98)),
        "accent": (255, 151, 193),
        "hair": (236, 173, 195),
        "hair_shadow": (182, 112, 139),
        "hair_highlight": (255, 216, 230),
        "skin": (247, 223, 211),
        "eye": (255, 174, 220),
        "outfit": (58, 35, 47),
        "outfit_light": (98, 66, 81),
        "hair_style": "idol_fluffy",
        "accessory": "pins",
        "mood": "hearts",
    },
}


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def rgba(color, alpha=255):
    return (*color, alpha)


def quadratic_points(p0, p1, p2, steps=18):
    points = []
    for index in range(steps + 1):
        t = index / steps
        mt = 1 - t
        x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0]
        y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]
        points.append((x, y))
    return points


def rounded(draw, box, fill, radius, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_gradient(canvas, top, bottom):
    draw = ImageDraw.Draw(canvas)
    for y in range(H):
        color = mix(top, bottom, y / max(H - 1, 1))
        draw.line((0, y, W, y), fill=color)


def add_glow(canvas, box, color, blur=52, alpha=140):
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(box, fill=rgba(color, alpha))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def add_atmosphere(canvas, cfg):
    draw_gradient(canvas, cfg["bg"][0], cfg["bg"][1])
    add_glow(canvas, (-80, 130, 340, 520), cfg["accent"], blur=80, alpha=120)
    add_glow(canvas, (430, -30, 780, 280), mix(cfg["accent"], (255, 255, 255), 0.45), blur=92, alpha=108)
    add_glow(canvas, (230, 400, 680, 1040), mix(cfg["accent"], (255, 255, 255), 0.2), blur=120, alpha=64)

    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    for x in range(-120, W + 120, 48):
        draw.line((x, 0, x + 240, H), fill=rgba((255, 255, 255), 10), width=2)

    mood = cfg["mood"]
    if mood == "grid":
        for x in range(60, W, 84):
            draw.line((x, 520, x, H), fill=rgba(cfg["accent"], 26), width=2)
        for y in range(560, H, 84):
            draw.line((0, y, W, y), fill=rgba(cfg["accent"], 22), width=2)
    elif mood == "petals":
        for cx, cy, size in [(120, 170, 18), (604, 190, 20), (620, 310, 12), (166, 262, 14)]:
            draw.ellipse((cx - size, cy - size * 0.55, cx + size, cy + size * 0.55), fill=rgba(cfg["accent"], 90))
            draw.ellipse((cx - size * 0.45, cy - size, cx + size * 0.45, cy + size), fill=rgba((255, 245, 248), 72))
    elif mood == "hearts":
        for cx, cy, size in [(128, 172, 14), (588, 152, 18), (636, 264, 12)]:
            draw.polygon(
                [
                    (cx, cy + size),
                    (cx - size, cy),
                    (cx - size * 0.65, cy - size * 0.7),
                    (cx, cy - size * 0.15),
                    (cx + size * 0.65, cy - size * 0.7),
                    (cx + size, cy),
                ],
                fill=rgba(cfg["accent"], 88),
            )
    elif mood == "moon":
        draw.ellipse((512, 58, 626, 172), fill=rgba((255, 244, 200), 88))
        draw.ellipse((548, 58, 656, 172), fill=rgba(cfg["bg"][1], 255))
        for cx, cy, size in [(120, 154, 8), (604, 118, 10), (646, 242, 7)]:
            draw.ellipse((cx - size, cy - size, cx + size, cy + size), fill=rgba(cfg["accent"], 120))
    else:
        for cx, cy, size in [(112, 148, 12), (628, 162, 10), (576, 94, 8), (642, 290, 7)]:
            draw.ellipse((cx - size, cy - size, cx + size, cy + size), fill=rgba((255, 255, 255), 96))
            draw.line((cx, cy - size * 2.3, cx, cy + size * 2.3), fill=rgba(cfg["accent"], 84), width=3)
            draw.line((cx - size * 2.3, cy, cx + size * 2.3, cy), fill=rgba(cfg["accent"], 84), width=3)

    canvas.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(1.3)))


def face_points():
    center_x = 360
    top_y = 150
    bottom_y = 536
    points = [(360, top_y), (448, 168), (498, 246), (506, 336), (486, 426), (434, 500), (360, bottom_y)]
    mirror = [(720 - x, y) for x, y in reversed(points[1:-1])]
    return points + mirror


def add_soft_shadow(canvas, points, color, offset=(8, 14), blur=20, alpha=90):
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    shifted = [(x + offset[0], y + offset[1]) for x, y in points]
    ImageDraw.Draw(layer).polygon(shifted, fill=rgba(color, alpha))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def hair_outline_points(style):
    if style == "commander":
        left = quadratic_points((180, 810), (118, 548), (158, 186), 18)
        top = quadratic_points((158, 186), (252, 36), (360, 74), 16)
        right = quadratic_points((360, 74), (530, 30), (566, 216), 16) + quadratic_points((566, 216), (620, 560), (548, 820), 18)
        return left + top + right
    if style == "soft_long":
        left = quadratic_points((190, 850), (120, 612), (170, 182), 18)
        top = quadratic_points((170, 182), (274, 20), (360, 56), 16)
        right = quadratic_points((360, 56), (494, 18), (560, 204), 16) + quadratic_points((560, 204), (610, 612), (530, 854), 18)
        return left + top + right
    if style == "mage_bob":
        left = quadratic_points((198, 752), (154, 486), (210, 164), 18)
        top = quadratic_points((210, 164), (300, 48), (360, 74), 14)
        right = quadratic_points((360, 74), (450, 44), (514, 182), 14) + quadratic_points((514, 182), (566, 500), (520, 752), 18)
        return left + top + right
    if style == "silver_sharp":
        left = quadratic_points((172, 804), (124, 582), (174, 156), 18)
        top = quadratic_points((174, 156), (284, 18), (360, 54), 16)
        right = quadratic_points((360, 54), (512, 16), (570, 170), 16) + quadratic_points((570, 170), (616, 582), (558, 816), 18)
        return left + top + right
    if style == "soft_wave":
        left = quadratic_points((190, 838), (112, 590), (178, 182), 18)
        top = quadratic_points((178, 182), (274, 30), (360, 60), 16)
        right = quadratic_points((360, 60), (504, 26), (566, 198), 16) + quadratic_points((566, 198), (616, 604), (534, 844), 18)
        return left + top + right
    if style == "tech_long":
        left = quadratic_points((198, 842), (136, 604), (188, 170), 18)
        top = quadratic_points((188, 170), (282, 26), (360, 62), 16)
        right = quadratic_points((360, 62), (510, 24), (572, 188), 16) + quadratic_points((572, 188), (620, 610), (550, 852), 18)
        return left + top + right
    if style == "classic_long":
        left = quadratic_points((194, 864), (122, 602), (180, 178), 18)
        top = quadratic_points((180, 178), (280, 18), (360, 52), 16)
        right = quadratic_points((360, 52), (500, 20), (564, 190), 16) + quadratic_points((564, 190), (616, 610), (540, 868), 18)
        return left + top + right
    if style == "gothic_tails":
        left_tail = [(120, 198), (178, 132), (236, 170), (218, 842), (122, 842)]
        crown = quadratic_points((220, 200), (286, 26), (360, 72), 14) + quadratic_points((360, 72), (434, 24), (500, 200), 14)
        right_tail = [(500, 200), (546, 136), (604, 178), (598, 844), (502, 844)]
        return left_tail + crown + right_tail
    left = quadratic_points((184, 808), (102, 560), (182, 156), 18)
    top = quadratic_points((182, 156), (286, 20), (360, 58), 16)
    right = quadratic_points((360, 58), (512, 18), (580, 174), 16) + quadratic_points((580, 174), (624, 570), (548, 818), 18)
    return left + top + right


def front_hair_shapes(style):
    if style == "commander":
        return [
            [(248, 142), (318, 102), (320, 266), (264, 304), (228, 236)],
            [(324, 104), (402, 96), (390, 278), (340, 296), (314, 194)],
            [(402, 102), (500, 148), (454, 302), (394, 290), (394, 196)],
            [(194, 246), (228, 200), (218, 428), (170, 606), (160, 432)],
            [(524, 244), (488, 198), (500, 420), (548, 604), (558, 430)],
        ]
    if style == "soft_long":
        return [
            [(246, 162), (302, 108), (324, 274), (264, 308), (228, 242)],
            [(324, 108), (396, 92), (392, 282), (340, 298), (314, 194)],
            [(394, 98), (496, 138), (452, 306), (394, 294), (392, 192)],
            [(204, 262), (244, 224), (236, 454), (196, 700), (168, 516)],
            [(518, 256), (474, 222), (482, 450), (522, 704), (548, 516)],
        ]
    if style == "mage_bob":
        return [
            [(244, 170), (308, 126), (324, 286), (264, 316), (226, 248)],
            [(326, 126), (392, 112), (392, 284), (342, 296), (320, 200)],
            [(392, 116), (482, 156), (450, 298), (392, 290), (392, 204)],
            [(206, 252), (250, 214), (234, 430), (198, 602), (174, 444)],
            [(514, 248), (474, 214), (484, 430), (520, 602), (544, 442)],
        ]
    if style == "silver_sharp":
        return [
            [(248, 146), (314, 96), (320, 258), (262, 292), (232, 232)],
            [(320, 98), (402, 86), (398, 268), (340, 286), (316, 186)],
            [(404, 88), (508, 140), (456, 292), (396, 284), (398, 190)],
            [(188, 228), (234, 180), (244, 444), (182, 652), (162, 464)],
            [(530, 222), (486, 180), (474, 440), (534, 650), (556, 462)],
        ]
    if style == "soft_wave":
        return [
            [(242, 160), (304, 108), (326, 278), (262, 312), (222, 246)],
            [(324, 108), (398, 94), (396, 286), (342, 300), (314, 194)],
            [(394, 98), (500, 142), (454, 312), (394, 296), (392, 192)],
            [(204, 274), (248, 236), (240, 452), (198, 714), (170, 524)],
            [(522, 268), (476, 236), (484, 444), (522, 716), (550, 522)],
        ]
    if style == "tech_long":
        return [
            [(246, 156), (314, 108), (322, 268), (262, 302), (224, 240)],
            [(324, 108), (398, 94), (394, 274), (340, 290), (314, 194)],
            [(394, 98), (500, 148), (454, 304), (394, 292), (392, 194)],
            [(198, 276), (236, 232), (230, 468), (190, 736), (164, 544)],
            [(522, 270), (476, 232), (482, 462), (520, 734), (546, 540)],
        ]
    if style == "classic_long":
        return [
            [(240, 160), (300, 106), (324, 284), (262, 316), (224, 244)],
            [(324, 106), (398, 92), (394, 286), (340, 300), (316, 194)],
            [(394, 96), (498, 142), (454, 314), (394, 300), (392, 192)],
            [(206, 282), (248, 240), (242, 504), (196, 784), (166, 582)],
            [(520, 276), (476, 238), (482, 500), (526, 786), (552, 584)],
        ]
    if style == "gothic_tails":
        return [
            [(244, 156), (302, 108), (320, 272), (260, 304), (224, 242)],
            [(320, 108), (398, 92), (394, 276), (340, 294), (316, 194)],
            [(396, 98), (490, 146), (452, 302), (394, 292), (392, 192)],
            [(184, 268), (234, 230), (222, 500), (182, 838), (150, 552)],
            [(534, 262), (484, 224), (494, 500), (538, 840), (570, 554)],
        ]
    return [
        [(238, 158), (306, 108), (326, 278), (260, 312), (222, 244)],
        [(324, 108), (402, 92), (394, 284), (340, 298), (316, 194)],
        [(398, 98), (506, 144), (456, 312), (394, 298), (396, 190)],
        [(206, 280), (252, 240), (244, 462), (204, 714), (170, 530)],
        [(522, 274), (474, 238), (482, 456), (520, 716), (550, 528)],
    ]


def draw_outfit(canvas, cfg):
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    shadow = mix(cfg["outfit"], (0, 0, 0), 0.35)
    outline = rgba(mix(cfg["outfit"], (0, 0, 0), 0.45), 240)

    add_soft_shadow(canvas, [(110, 920), (186, 620), (534, 620), (610, 920)], shadow, offset=(0, 16), blur=26, alpha=110)
    draw.polygon([(116, 960), (176, 626), (544, 626), (604, 960)], fill=rgba(cfg["outfit"], 255))
    draw.polygon([(192, 642), (274, 622), (334, 762), (238, 960), (134, 960)], fill=rgba(cfg["outfit_light"], 208))
    draw.polygon([(528, 642), (446, 622), (386, 762), (482, 960), (586, 960)], fill=rgba(cfg["outfit_light"], 208))
    draw.polygon([(272, 626), (360, 740), (448, 626), (480, 960), (240, 960)], fill=rgba(cfg["outfit"], 255))
    draw.polygon([(286, 626), (360, 714), (434, 626), (402, 648), (360, 690), (318, 648)], fill=rgba((248, 245, 247), 252))
    draw.line([(218, 632), (320, 674)], fill=outline, width=4)
    draw.line([(502, 632), (400, 674)], fill=outline, width=4)
    draw.line([(320, 674), (360, 736), (400, 674)], fill=outline, width=4)
    draw.ellipse((316, 740, 404, 828), fill=rgba(cfg["accent"], 26))
    canvas.alpha_composite(layer)


def draw_neck_and_face(canvas, cfg):
    face = face_points()
    face_outline = mix(cfg["skin"], (115, 92, 102), 0.45)

    neck_layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(neck_layer)
    add_soft_shadow(canvas, face, (0, 0, 0), offset=(10, 12), blur=24, alpha=72)
    draw.ellipse((292, 498, 428, 684), fill=rgba(cfg["skin"], 255))
    draw.polygon([(302, 612), (418, 612), (442, 760), (278, 760)], fill=rgba(cfg["skin"], 255))
    canvas.alpha_composite(neck_layer)

    face_layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(face_layer)
    draw.polygon(face, fill=rgba(cfg["skin"], 255))
    draw.line(face + [face[0]], fill=rgba(face_outline, 228), width=5)
    draw.ellipse((234, 360, 282, 420), fill=rgba(cfg["skin"], 255))
    draw.ellipse((438, 360, 486, 420), fill=rgba(cfg["skin"], 255))
    canvas.alpha_composite(face_layer)


def draw_eye(draw, center, iris_color, tilt=0.0):
    cx, cy = center
    width = 92
    height = 36
    top = quadratic_points((cx - width / 2, cy), (cx - 6, cy - height), (cx + width / 2, cy - 2), 18)
    bottom = quadratic_points((cx + width / 2, cy - 2), (cx + 6, cy + height * 0.35), (cx - width / 2, cy + 8), 18)
    eye_shape = [(x, y + tilt * (x - cx) / width * 20) for x, y in top + bottom]
    draw.polygon(eye_shape, fill=rgba((255, 255, 255), 245))
    draw.line([(x, y + tilt * (x - cx) / width * 20) for x, y in top], fill=rgba((40, 28, 42), 248), width=6)
    draw.line([(x, y + tilt * (x - cx) / width * 20) for x, y in bottom], fill=rgba((88, 73, 90), 138), width=3)

    iris_y = cy + 10
    draw.ellipse((cx - 26, iris_y - 24, cx + 26, iris_y + 28), fill=rgba(mix(iris_color, (32, 24, 42), 0.35), 255))
    draw.ellipse((cx - 22, iris_y - 18, cx + 22, iris_y + 22), fill=rgba(iris_color, 255))
    draw.ellipse((cx - 12, iris_y - 8, cx + 12, iris_y + 6), fill=rgba(mix(iris_color, (255, 255, 255), 0.4), 132))
    draw.ellipse((cx - 13, iris_y + 4, cx + 13, iris_y + 26), fill=rgba((28, 22, 34), 214))
    draw.ellipse((cx - 8, iris_y - 16, cx + 4, iris_y - 4), fill=rgba((255, 255, 255), 238))
    draw.ellipse((cx + 8, iris_y - 3, cx + 15, iris_y + 4), fill=rgba((255, 255, 255), 176))
    draw.line((cx - 46, cy - 2, cx - 60, cy - 10), fill=rgba((40, 28, 42), 220), width=4)
    draw.line((cx + 46, cy - 2, cx + 60, cy - 10), fill=rgba((40, 28, 42), 220), width=4)


def draw_features(canvas, cfg):
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw_eye(draw, (292, 322), cfg["eye"], tilt=-0.18)
    draw_eye(draw, (428, 322), cfg["eye"], tilt=0.18)
    draw.arc((238, 244, 334, 294), start=205, end=340, fill=rgba((68, 48, 60), 210), width=5)
    draw.arc((386, 244, 482, 294), start=200, end=335, fill=rgba((68, 48, 60), 210), width=5)
    draw.line((360, 360, 354, 398), fill=rgba((205, 170, 160), 148), width=4)
    draw.arc((334, 416, 388, 450), start=8, end=172, fill=rgba((184, 100, 114), 210), width=4)
    draw.ellipse((330, 418, 390, 458), fill=rgba((255, 165, 181), 16))
    blush = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    blush_draw = ImageDraw.Draw(blush)
    blush_color = rgba((255, 183, 198), 72)
    blush_draw.ellipse((232, 376, 288, 424), fill=blush_color)
    blush_draw.ellipse((432, 376, 488, 424), fill=blush_color)
    canvas.alpha_composite(blush.filter(ImageFilter.GaussianBlur(10)))
    canvas.alpha_composite(layer)


def draw_back_hair(canvas, cfg):
    style = cfg["hair_style"]
    outline_points = hair_outline_points(style)
    shadow_points = [(x + 8, y + 16) for x, y in outline_points]
    inner_points = [(x + (360 - x) * 0.06, y + 10) for x, y in outline_points]

    add_soft_shadow(canvas, shadow_points, cfg["hair_shadow"], offset=(0, 0), blur=32, alpha=124)

    back = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(back)
    draw.polygon(outline_points, fill=rgba(cfg["hair_shadow"], 255))
    draw.polygon(inner_points, fill=rgba(cfg["hair"], 255))

    highlight = [
        (x, y)
        for x, y in quadratic_points((266, 120), (210, 290), (252, 690), 24)
        + quadratic_points((252, 690), (284, 762), (324, 792), 8)
    ]
    draw.line(highlight, fill=rgba(cfg["hair_highlight"], 110), width=26)
    draw.line([(x + 178, y - 18) for x, y in highlight], fill=rgba(cfg["hair_highlight"], 82), width=18)

    if style in {"soft_wave", "soft_long", "classic_long", "tech_long"}:
        draw.line([(198, 476), (174, 598), (192, 752)], fill=rgba(cfg["hair_shadow"], 132), width=12)
        draw.line([(522, 456), (548, 596), (530, 764)], fill=rgba(cfg["hair_shadow"], 132), width=12)

    canvas.alpha_composite(back)


def draw_front_hair(canvas, cfg):
    style = cfg["hair_style"]
    front_shapes = front_hair_shapes(style)
    outline_color = mix(cfg["hair_shadow"], (0, 0, 0), 0.35)
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    for strand in front_shapes:
        draw.polygon(strand, fill=rgba(cfg["hair"], 255))
        draw.line(strand + [strand[0]], fill=rgba(outline_color, 210), width=3)

    canvas.alpha_composite(layer)


def draw_accessory(canvas, cfg):
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    accent = cfg["accent"]
    accessory = cfg["accessory"]

    if accessory == "hat":
        draw.polygon([(164, 212), (548, 212), (438, 76), (280, 96)], fill=rgba((84, 62, 137), 255))
        draw.ellipse((142, 196, 570, 288), fill=rgba((63, 47, 104), 255))
        draw.rounded_rectangle((284, 162, 418, 194), radius=16, fill=rgba((250, 223, 173), 160))
        draw.line((246, 158, 308, 114), fill=rgba((255, 154, 121), 255), width=16)
    elif accessory == "headset":
        draw.arc((180, 200, 542, 510), start=190, end=352, fill=rgba((118, 238, 219), 220), width=14)
        draw.ellipse((182, 334, 252, 452), fill=rgba((32, 42, 48), 255))
        draw.ellipse((470, 334, 540, 452), fill=rgba((32, 42, 48), 255))
        draw.line((508, 438, 560, 482), fill=rgba((118, 238, 219), 180), width=7)
    elif accessory == "glasses":
        rounded(draw, (252, 304, 338, 358), None, radius=16, outline=rgba((212, 231, 255), 245), width=4)
        rounded(draw, (382, 304, 468, 358), None, radius=16, outline=rgba((212, 231, 255), 245), width=4)
        draw.line((338, 332, 382, 332), fill=rgba((212, 231, 255), 245), width=4)
    elif accessory == "ribbon":
        draw.polygon([(286, 188), (326, 246), (258, 252)], fill=rgba(accent, 255))
        draw.polygon([(434, 188), (394, 246), (462, 252)], fill=rgba(accent, 255))
        draw.ellipse((324, 192, 396, 262), fill=rgba((255, 237, 248), 255))
    elif accessory == "scarf":
        draw.rounded_rectangle((262, 626, 458, 762), radius=60, fill=rgba((255, 207, 220), 250))
        draw.polygon([(324, 704), (362, 934), (402, 934), (392, 694)], fill=rgba((255, 207, 220), 250))
    elif accessory == "brooch":
        draw.ellipse((328, 706, 394, 772), fill=rgba((255, 232, 186), 255))
        draw.polygon([(360, 720), (372, 744), (398, 748), (378, 768), (384, 796), (360, 784), (336, 796), (342, 768), (322, 748), (348, 744)], fill=rgba((255, 248, 219), 255))
    elif accessory == "pins":
        draw.line((220, 154, 258, 198), fill=rgba((255, 191, 212), 255), width=10)
        draw.line((488, 146, 532, 190), fill=rgba((255, 227, 140), 255), width=10)
        draw.line((202, 194, 252, 176), fill=rgba((255, 191, 212), 180), width=6)
    elif accessory == "earring":
        draw.ellipse((236, 414, 258, 442), fill=rgba((255, 218, 166), 255))
        draw.ellipse((460, 414, 482, 442), fill=rgba((255, 218, 166), 255))
    else:
        draw.polygon([(220, 176), (264, 150), (302, 178), (260, 212)], fill=rgba(accent, 220))

    canvas.alpha_composite(layer)


def add_foreground_fx(canvas, cfg):
    layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    accent = cfg["accent"]

    draw.rounded_rectangle((22, 22, W - 22, H - 22), radius=44, outline=rgba(mix(accent, (255, 255, 255), 0.15), 72), width=2)
    draw.rectangle((0, 690, W, H), fill=rgba((8, 6, 12), 34))

    for cx, cy, size in [(86, 812, 18), (624, 736, 12), (592, 112, 9)]:
        draw.ellipse((cx - size, cy - size, cx + size, cy + size), fill=rgba(accent, 46))

    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.8)))


def render_agent(cfg):
    canvas = Image.new("RGBA", SIZE, (0, 0, 0, 255))
    add_atmosphere(canvas, cfg)
    draw_outfit(canvas, cfg)
    draw_back_hair(canvas, cfg)
    draw_neck_and_face(canvas, cfg)
    draw_features(canvas, cfg)
    draw_front_hair(canvas, cfg)
    draw_accessory(canvas, cfg)
    add_foreground_fx(canvas, cfg)
    return canvas.filter(ImageFilter.GaussianBlur(0.15))


def save_contact_sheet(out_dir, generated):
    thumb_w = 220
    thumb_h = 292
    margin = 18
    columns = 3
    rows = (len(generated) + columns - 1) // columns
    sheet = Image.new(
        "RGB",
        (columns * thumb_w + (columns + 1) * margin, rows * thumb_h + (rows + 1) * margin + 24 * rows),
        (11, 8, 15),
    )
    draw = ImageDraw.Draw(sheet)
    for index, (agent_id, image) in enumerate(generated):
        x = margin + (index % columns) * (thumb_w + margin)
        y = margin + (index // columns) * (thumb_h + margin + 24)
        sheet.paste(image.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS).convert("RGB"), (x, y))
        draw.text((x, y + thumb_h + 4), agent_id, fill=(230, 226, 236))
    sheet.save(out_dir / "_contact-sheet.jpg", quality=92)


def main():
    out_dir = Path("public/agent-portraits")
    out_dir.mkdir(parents=True, exist_ok=True)
    generated = []
    for agent_id, cfg in AGENTS.items():
        image = render_agent(cfg)
        image.save(out_dir / f"{agent_id}.png")
        generated.append((agent_id, image))
    save_contact_sheet(out_dir, generated)


if __name__ == "__main__":
    main()

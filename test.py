seen = set()

with open("public/data/celeba/identity_CelebA.txt") as f:
    for line in f:
        _, value = line.split()
        value = int(value)

        if value in seen:
            print(value)
            break

        seen.add(value)

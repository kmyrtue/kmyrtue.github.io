mapName = 'grasMap'

f = open(mapName + 'Matrix.bmp', 'rb')
data = bytearray(f.read())
f.close()    
map1 = []
for x in range(138,len(data),4):
    if data[x+1] != 0 or data[x+2] != 0 or data[x+3] != 0:
        map1.append(0)
    else:
        map1.append(1)
w = open(mapName + 'Matrix.txt', 'w')
w.close()
w = open(mapName + 'Matrix.txt', 'a')
for i in range(0, len(map1)):
    if i % 4000 == 0 and i != 0:
        w.write('|'+str(map1[i]))
    w.write(str(map1[i]))
w.close()

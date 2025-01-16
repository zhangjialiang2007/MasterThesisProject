# MasterThesisProject
the master's thesis project for zhangjialiang


# start
Type `http-server -o` in command line 
the you can see the log in console


## TimeDependentDijkstra
初始化：路网数据
输入：根据起点和终点，以及出发时间，计算出最短路径
输出：最短路径，以及路径上的时间

## 时间约束
如果不满足时间约束，则调整策略。由于很难不满足，所以这里采取手动实现，不满足则报错，手动调整。

## 需求约束
目前需求约束是每个受灾点最多只能被配送两次，如果不满足需求约束，则需要调整策略。
目前这里也是采取的报错，然后手动调整；
先这样，后面优化有需要的话，再做限制。。或者这个约束是否可以去掉

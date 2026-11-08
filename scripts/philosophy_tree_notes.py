"""Additive editorial notes: imported notes are never rewritten by this module."""
def source(title,url,locator,kind='学术研究入口'):
 return dict(title=title,url=url,locator=locator,kind=kind,note='供核查本条辨析与进一步阅读；新增解释由本站编写，不表示原始导图已整体完成审校。')
SEP='https://plato.stanford.edu/entries/'
S={
 'logic':source('亚里士多德《前分析篇》第一卷','https://classics.mit.edu/Aristotle/prior.1.i.html','第一卷第5章，第二格；第4—7章对有效式的讨论','原典旧英译'),
 'square':source('SEP：传统对当方阵',SEP+'square/','第1、1.1节：矛盾、上反对与空类问题'),
 'hume':source('SEP：休谟',SEP+'hume/','心灵、因果、认识论与伦理学；著作目录'),
 'laws':source('亚里士多德《形而上学》第四卷','https://classics.mit.edu/Aristotle/metaphysics.4.iv.html','第四卷第3、7章：不矛盾与排中','原典旧英译'),
 'universals':source('SEP：中世纪共相问题',SEP+'universals-medieval/','实在论、唯名论及共相问题的历史框架'),
 'time':source('奥古斯丁《忏悔录》第十一卷','https://www.newadvent.org/fathers/110111.htm','第20、26—28章，尤其XI.27.36：在心灵中度量时间','原典旧英译'),
 'ficino':source('SEP：马尔西利奥·费奇诺',SEP+'ficino/','生平、翻译与《柏拉图神学》'),
 'erasmus':source('SEP：伊拉斯谟',SEP+'erasmus/','导言及教育、圣经研究与基督教人文主义'),
 'luther':source('SEP：马丁·路德',SEP+'luther/','神学与哲学、理性的地位及实践生活'),
 'bacon':source('SEP：罗吉尔·培根',SEP+'roger-bacon/','十三世纪生平及知识方案'),
 'presocratic':source('SEP：前苏格拉底哲学',SEP+'presocratics/','第2节，米利都与阿那克西曼德；片段与后世见证的区别'),
 'kant':source('SEP：康德',SEP+'kant/','批判哲学、经验与理性；生平和著作'),
 'fichte':source('SEP：约翰·戈特利布·费希特',SEP+'johann-fichte/','第1—3节：康德的接受与知识学开端'),
 'schelling':source('SEP：谢林',SEP+'schelling/','第1—3、5节：早期发展、同一哲学、后期对黑格尔的批评'),
 'hegel':source('SEP：黑格尔',SEP+'hegel/','第1、2.1节及著作目录：德国观念论的语境'),
}
# Lines refer to LF-delimited source topics, not text editor universal-newline lines.
REVIEWS = []  # 原始笔记的审阅材料未随公开版发布。
EXTRA_FIGURES=[
 dict(id='roger-bacon',name='罗吉尔·培根',aliases=['罗吉尔·培根'],lifeLabel='约1214—约1292',summary='十三世纪的修会学者，关注语言、数学、光学及经验在知识中的作用。其计划仍置于基督教知识与教育环境中；“实验”不可直接等同今日实验室制度。',questions=['语言能力怎样影响对经典与自然的理解？','数学、经验及神学的关系应怎样分辨？'],works=['《大著作》（1267年前后）：由知识障碍、语言、数学等部分理解其改革计划。'],sources=[S['bacon']]),
 dict(id='hume',name='大卫·休谟',aliases=['休谟'],lifeLabel='1711—1776',summary='本树的休谟分支连接知觉、因果、信念、情感与道德判断。进入康德的回应之前，应先区分“没有理性证明某种必然联系”和“人在生活中没有任何因果信念”两种说法。',questions=['从反复经验怎样形成因果期待？','事实判断与道德判断的关系是什么？'],works=['《人性论》与《人类理解研究》：结合因果与信念问题对读。'],sources=[S['hume']]),
 dict(id='kant',name='伊曼努尔·康德',aliases=['康德'],lifeLabel='1724—1804',summary='批判哲学分别追问经验知识何以可能、道德义务的根据及判断力如何联系自然与自由。现象与物自身的区分不等于世界只由个人想象构成，理论认识的限制也不直接等于伦理或宗教问题的取消。',questions=['知识的条件与知识的对象有何区别？','道德自由能否由自然科学直接证明？'],works=['《纯粹理性批判》（1781；1787第二版）：先比较两版序言与导论。','《实践理性批判》（1788）与《判断力批判》（1790）：分别阅读各自提出的问题。'],sources=[S['kant']]),
 dict(id='fichte',name='约翰·戈特利布·费希特',aliases=['费希特'],lifeLabel='1762—1814',summary='从接受康德到建立知识学，费希特尝试以自我活动解释知识与行动的结构。其“自我”不能直接理解为某个个人任性创造外在世界；不同时期的知识学及其法权、伦理方案需要分别阅读。',questions=['自我活动怎样成为知识的起点？','承认他人如何进入自由和法权的说明？'],works=['《全部知识学的基础》（1794—1795）：结合命题的推演与实践部分阅读。'],sources=[S['fichte']]),
 dict(id='schelling',name='弗里德里希·威廉·约瑟夫·谢林',aliases=['谢林'],lifeLabel='1775—1854',summary='谢林的思想从自然哲学、先验哲学、同一哲学继续转向自由、神话与启示等问题。与费希特和黑格尔的关系随时期改变，不能用一个“绝对同一”口号概括其整个写作生涯。',questions=['自然能否只作为主体的被动对象来解释？','自由与恶为何成为其后来讨论的中心？'],works=['《先验唯心论体系》（1800）与《论人类自由的本质》（1809）：注意两书问题及阶段的区别。'],sources=[S['schelling']]),
 dict(id='hegel',name='格奥尔格·威廉·弗里德里希·黑格尔',aliases=['黑格尔','黑格尔 2'],lifeLabel='1770—1831',summary='黑格尔把逻辑、自然、精神与历史联系到系统的哲学工作中。意识、承认、制度与自由在不同著作中有不同论证任务；不能把全部辩证法缩成“正反合”三字公式，也不能把后人的历史结果直接当作其原文的结论。',questions=['意识经验的变化与逻辑范畴的运动是否是同一任务？','自由怎样在社会制度中获得具体形式？'],works=['《精神现象学》（1807）：先辨认序言、导论和意识经验的结构。','《逻辑学》（1812—1816）及《法哲学原理》（1820年出版、题年1821）：分别辨认讨论对象。'],sources=[S['hegel']]),
]
ALIASES={'socrates':['苏格拉底'],'plato':['柏拉图'],'aristotle':['亚里士多德'],'epicurus':['伊壁鸠鲁','伊壁鸠鲁学派'],'zeno-stoa':['季蒂昂的芝诺'],'plotinus':['普罗提诺'],'augustine':['奥古斯丁','奥古斯丁（柏拉图——奥古斯丁主义）'],'aquinas':['托马斯阿奎那'],'anselm':['安瑟尔谟/安瑟伦'],'abelard':['阿伯拉尔'],'duns-scotus':['邓斯·司各脱'],'ockham':['威廉·奥康（奥卡姆）'],'bacon':['弗朗西斯·培根'],'descartes':['笛卡尔'],'epictetus':['爱比克泰德'],'cusa':['尼古拉·库萨','库萨的尼古拉'],'machiavelli':['马基雅维利'],'ficino':['费奇诺'],'pico':['皮科'],'petrarch':['彼特拉克'],'montaigne':['蒙田'],'erasmus':['伊拉斯谟','伊拉斯莫','爱拉斯谟'],'luther':['路德','马丁·路德'],'calvin':['加尔文'],'boethius':['波埃修','波爱修斯']}
MODERN_RELATIONS=[]
def relation(id,a,b,type,title,text,ref):
 MODERN_RELATIONS.append(dict(id='tree-rel-'+id,fromId=a,toId=b,type=type,title=title,summary=text,evidenceStatus='初步编选 · 有研究出处，尚待逐段原典复核',provenance='本站新增关系；非由原导图父子线自动推断',sources=[S[ref]]))
relation('hume-kant','hume','kant','reception','因果问题的批判性回应','休谟提出的因果认识问题构成理解康德批判工作的一个重要背景。康德并非简单回到被怀疑前的理性主义；两者对经验与必然性的解释仍须分开。','kant')
relation('kant-fichte','kant','fichte','reception','由康德阅读走向知识学','费希特在接受康德之后重新安排哲学的第一原理。继承与改造同时存在，不能仅凭“康德之后”就说两人的体系一致。','fichte')
relation('kant-schelling','kant','schelling','reception','自然与自由问题的重新展开','谢林的早期哲学形成于康德及其后继者提出的问题环境中；他的自然哲学与先验哲学是进一步的尝试，不是康德原说的复写。','schelling')
relation('kant-hegel','kant','hegel','critique','对批判哲学界限的重新讨论','黑格尔在后康德问题中发展自己的系统，并质疑某些固定二分。这里的批评同时依赖对前人问题的接受，不能理解为二者毫无关联。','hegel')
relation('fichte-schelling','fichte','schelling','critique','从知识学走向自然哲学的分歧','谢林早期接受费希特的启发，后来对自然的地位及体系起点提出不同方案；关系有时间变化，不能只画成永久的师承链。','schelling')
relation('schelling-hegel','schelling','hegel','context','早期合作与逐渐分歧','两人在早期思想环境中有密切交往与合作，但各自的哲学发展不能合并为一套体系。此线表示交往语境，不据此单独证明某个概念的直接传授。','hegel')
relation('hegel-schelling','hegel','schelling','critique','谢林后来对黑格尔体系的批评','谢林后期区分消极与积极哲学并批评黑格尔式体系。此线由被回应者指向回应者；它不是两个思想家在同一时刻互相批评的简图。','schelling')
relation('fichte-hegel','fichte','hegel','critique','后康德体系的不同方向','黑格尔通过讨论费希特与谢林体系的差别形成自身的早期系统立场。其后成熟哲学仍须结合具体著作，不能由一篇早期比较穷尽。','hegel')

REVIEW_LINKS={617:(["aristotle"],[],[]),706:(["aristotle"],[],[]),1427:(["augustine"],["work-confessions"],[]),1554:(["anselm","abelard","ockham"],[],["question-universals"]),1826:(["bacon"],["work-novum-organum"],[]),2006:(["ficino","cusa"],["work-platonic-theology"],[]),2025:(["erasmus"],["work-novum-instrumentum"],[]),2145:(["luther","calvin"],[],["question-faith-reason"])}
for review in REVIEWS:
 review["personIds"],review["workIds"],review["questionIds"]=REVIEW_LINKS.get(review["line"],([],[],[]))

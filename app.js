'use strict';
const categories = {automation:'自动化工作站',instrument:'实验与仪器',software:'软件与 AI',mechanical:'机械与硬件'};
const projects = [
 {id:'solid',category:'automation',title:'腐蚀性极细无机粉末自动加样系统',summary:'参与 32 杯粉末自动加样系统集成，协调 9 个磁悬浮动子、8 个加样头与机械臂，把逐杯配方、并行工序与真实结果关联。',tags:['Python / FastAPI','S7 PLC','PostgreSQL','JSON / CSV'],state:'设备联调与现场复验 / 分版本验证',problem:'取放瓶、加样、闭盖、回托与连续换盘共享设备和空间。需要核对杯身份、工序衔接及中断后的原动作，避免重复加料或错误恢复。',role:'参与粉末自动加样系统集成，开展需求拆解、设备接口核对、现场联调和异常排查；使用 Codex 辅助开发，结合回读状态与日志确定推进和恢复条件。',solution:[
  '设备与流程：对接 9 个磁悬浮动子、8 个加样头及机械臂、夹爪，梳理 32 杯批次的进料、取放瓶、加样、闭盖、回托与连续换盘。',
  '配方与并行：核对逐杯配方、多头多次加样、杯身份及孔位；结合工位占用、路径检查、预取盖与预定位，梳理并行工序和动作衔接。',
  '受控恢复：依据持久化流程状态、原命令及设备回读定位中断工步；区分未执行、已执行与结果不确定，定义人工核验条件并核对生产、维护与手动操作的控制权互斥。',
  '结果追溯：项目通过浏览器控制台关联扫码身份、孔位、配方与逐次加样实测记录，导出 JSON / CSV 交接文件，支持偏差查看、历史回查和异常追溯。',
  '现场改进：针对拧盖失败停机开展动作实验并提出复拧方案；方案调整后完成现场复验，失败及停机情况得到改善。'
 ],evidence:'2026-10-16 简历补充了集成范围、连续流程、受控恢复、结果追溯及复拧现场验证。2026-09-28 总册另记载历史 32 瓶八头批次有 64 项加样记录与成功终态；本次网页更新未重新运行设备或复核原始批次文件。',boundary:'32 杯、9 个动子与 8 个加样头是系统配置，不代表实测产能或效率提升。复拧改善未提供量化幅度，历史批次质量允差尚待评估。2026-09-29 新 LabOS 模式的首批仿真 10 次中 5 次通过，仍有阻断或原因未留存；不能据此认定新模式已完成稳定实机验收。'},
 {id:'thermal',category:'instrument',title:'温控与多物性联合测试',summary:'连接温控、密度黏度和电导率设备，组织多模式实验、联合判稳与数据回放。',tags:['Modbus RTU/TCP','RS485 ASCII','Python'],state:'采集与流程资料 / 计量性能单独验证',problem:'多设备采样节奏和热响应不同，单点到温不代表整体稳态。需要保留时间差与原始测量，才能解释实验结果。',role:'完成设备通信联调、实验步骤定义、判稳条件核对与数据分析流程，使用 AI 辅助软件实现。',solution:['分别适配 RTU、TCP 与 RS485 ASCII；不将不同仪器的寄存器和协议混用。','用温度与物性数据共同定义阶段切换，保留原始采样、状态字、事件和终止原因。','分别计算升降温过程与稳态等待，结合均值、标准差、极差和拟合残差分析重复性。'],evidence:'项目总册 P07—P09 记录了循环、阶梯、基准、分段速率与温差模式的实现和历史实验分析。',boundary:'各模式设备互锁和失效策略不同。模型拟合与采样目标不等于普适计量精度；每次实验需明确起止与稳态规则。'},
 {id:'neware',category:'instrument',title:'Neware 测试与数据闭环',summary:'将测试下发、通道身份、上传状态和数据库记录关联，核查设备结束后数据是否完整。',tags:['TCP/XML','Electron','PostgreSQL'],state:'历史短流程闭环 / 原始证据待复核',problem:'TCP 回复可能拆帧、超时或滞留；设备任务结束和数据上传完成属于不同状态。',role:'依据项目资料主导测试编排、接口联调与任务数据关联，使用 AI 辅助实现。',solution:['按消息结束标记处理接收缓冲，使用请求队列避免响应错配。','用任务码关联通道、设备状态与数据库记录，启动结果不明时先核查原任务。','接入 DBWB 服务，将设备终态、上传终态与导出核验证据分别记录。'],evidence:'总册 P14 引用的历史短流程证据记载 5 项检查、482 条记录和 17 个控制事件。本次未复跑或独立读取该原始证据文件。',boundary:'历史任务主要为 0 A 静置与短流程，不是完整充放电性能或测量精度认证，也不能证明全部设备型号兼容。'},
 {id:'gas',category:'instrument',title:'双泵气路与 GC 进样',summary:'连接串口泵与 BLE 测压，组织洗气、标气注入、气体转移和进样衔接。',tags:['RS485','BLE','GC'],state:'多分支流程 / 阀口与启动方式分开',problem:'泵位置、剩余容量、阀位和压力稳定性共同约束气体转移，固定等待可能掩盖尚未平衡。',role:'完成泵与传感器联调，定义流程阶段、体积换算、边界动作及记录项。',solution:['核对泵状态、阀位与位置回读，按当前针筒规格换算执行量。','组织互不冲突的双泵动作，以压力记录辅助判断等待。','区分手动启动 GC 的进样流程和后续软件接入分支。'],evidence:'简历与总册 P10 记录双泵、He 和单泵六通阀的不同版本及接口。',boundary:'不同分支 O3/O4 管路定义不相同。气路流程完成不能替代 GC 测试启动、组分定量或系统泄漏验收。'},
 {id:'electrolysis',category:'instrument',title:'电解水产气联测',summary:'通过测试仪与 BLE 传感器组织基线、阶段运行和停止确认，保留实验全过程记录。',tags:['TCP/XML','BLE','CSV'],state:'联测流程 / 停止必须核查',problem:'电流程序、压力、温度与产气量需要关联；失联时设备可能仍在运行。',role:'开展接口联调、阶段条件核对、传感器数据检查和实验记录整理。',solution:['保留原始绝压用于保护判断，热修正模型仅承担分析。','区分正常结束、人工停止和异常终止，记录阶段状态与操作事件。','停止请求后核查设备确认；结果未知时保留可能运行状态。'],evidence:'简历及总册 P11 描述了测试仪、BLE 压力与温控协调和历史记录。',boundary:'理论产气量不能作为实测量。设备失联、端口关闭或发送停止都不直接证明物理停稳。'},
 {id:'vacuum',category:'instrument',title:'真空箱与四腔室控制',summary:'从自定义 RS485 帧到机械动作回读，组织抽放气顺序和现场串口排错。',tags:['C# WinForms','RS485','HTBUS'],state:'部分四腔室记录 / 异常策略有版本边界',problem:'应答成功和门、托盘、阀的实际动作必须分开核对，传感器状态也需要持续确认。',role:'梳理上位机需求、核对构帧与解析、完成接线与动作接口联调。',solution:['检查设备身份、状态字和数据新鲜度，限制持续通信失败后的下发。','结合状态快照、通信日志、CSV 和曲线定位异常环节。','按腔室状态推进顺序，不把不同控制分支的停止命令合并。'],evidence:'简历及总册 P13 记录了 C# 上位机、四腔室顺序脚本和部分运行记录。',boundary:'通信中断不等于真空或阀门状态安全。总册注明四舱异常分支不自动下发全部停机命令，仍需独立核验现场保护。'},
 {id:'liquid',category:'automation',title:'液体配方工作站',summary:'将配方、盖库、加液和震荡动作组织成具备资源约束的工作站流程。',tags:['Python','WebSocket','S7 PLC'],state:'服务与适配实现 / 整站闭环未确认',problem:'加液通道、机械动作与盖库资源共享，单项动作记录不足以证明全站闭环。',role:'项目总册归纳了需求、开发与设备联调职责；具体工作按模块与版本讨论。',solution:['使用 WebSocket 适配加液设备，不混用旧版裸 TCP 描述。','将共享工位、资源占用与流程前置条件分开建模。','区分模拟端点、现场配置与单项验证记录。'],evidence:'总册 P02 记载服务与设备适配实现，归位和扫码有单项记录。',boundary:'单项归位或扫码通过不能推定液体站全流程实机验收完成。'},
 {id:'erp',category:'software',title:'库存与扫码借还系统',summary:'以桌面管理端和移动服务连接库存、资产状态、借还记录与审计流水。',tags:['Electron','Fastify','PostgreSQL'],state:'业务实现资料 / 用户规模未核实',problem:'扫码借还需要处理重复请求、事务一致性与桌面和移动端共同访问。',role:'按总册职责口径开展需求与软件开发，使用 AI 辅助实现。',solution:['以 PostgreSQL 事务与幂等请求保护借还和库存一致性。','使用白名单 IPC 将 Electron 界面与受控后台能力连接。','移动服务与数据库连接池生命周期同步，避免切换后继续操作旧连接。'],evidence:'总册 P15 记录当前 Electron / PostgreSQL 实现和 HTTPS 移动协同，不沿用早期浏览器存储说明。',boundary:'没有独立核实正式上线用户数、部署规模或节省成本，网页不采用这些指标。'},
 {id:'agent',category:'software',title:'Lab Agent 受控泵控原型',summary:'将自然语言转成结构化动作计划，经白名单与参数检查后交给确定性执行器。',tags:['JSON Schema','工具白名单','Simulation'],state:'仿真链路 / 模型到实机闭环待确认',problem:'模型输出不能直接变成任意硬件命令，必须限定动作、端口、体积和执行条件。',role:'围绕实验操作需求构建原型流程，使用 AI 辅助开发，按日志和真实适配边界讨论成果。',solution:['模型产生 JSON 计划，经 Schema、白名单和参数限制核验。','操作确认后逐步执行，记录耗时与失败；异常时尝试停止并保留停止失败信息。','仿真与真实适配器显式分开，不以存在 real 配置认定已完成实机运行。'],evidence:'总册 P16 记载仿真日志、受控执行器与真实泵适配器。',boundary:'模型到硬件端到端尚未证实；绝压保护、GC 启动、定量和自动报告未形成完整接入。'},
 {id:'wheel',category:'mechanical',title:'可变形轮足机器人',summary:'用六腿变形机构连接六足行走与圆形滚动两种运动模式。',tags:['SolidWorks','Arduino','碳纤维'],state:'动作验证 / 性能指标未提供',problem:'腿部既要完成行走动作，也要折叠收拢成滚动状态，变形过程需要协调关节。',role:'机械结构与控制项目，完成六腿变形机构、关节和整体装配设计及动作调试。',solution:['以 SolidWorks 进行机构与整体装配建模。','结合碳纤维腿部件考虑轻量化。','通过 Arduino 调试多关节协调、折叠与模式切换。'],evidence:'最新简历记载：2024.01—2025.09，完成六足行走与滚动模式动作验证。',boundary:'未提供载荷、速度、能耗或连续运行数据，不补造性能数字。'},
 {id:'feed',category:'mechanical',title:'密闭加料机械概念',summary:'围绕瓶装粉末、密封接口和称重路径建立参数化装配，区分支撑与称重旁路。',tags:['参数化 CAD','STEP','称重受力'],state:'机械概念 / 制造与密封待验证',problem:'瓶和阀的自重、手柄扭矩以及软管受力会改变密封与称重结果。',role:'开展接口与受力边界方案梳理，使用参数化 CAD 辅助装配表达。',solution:['区分两版支撑归属，不让接口和软管承担未定义的结构载荷。','核对螺纹、端面密封和管路过渡的装配关系。','对称重路径保持明确边界，避免独立框架形成测量旁路。'],evidence:'总册 P17 记录参数化概念、STEP / FCStd 和几何检查。',boundary:'属于概念与几何检查，未证明加工、密封、计量或自动控制闭环。'},
 {id:'report',category:'software',title:'LabReportAgent 报告工具构想',summary:'面向保压、温控、GC 与重复性实验，将数据解析、确定性计算和 Word 报告串联。',tags:['实验数据','Python 规划','Word 报告'],state:'历史需求设计 / 完成度待核实',problem:'实验报告需要明确单位、起止规则、稳态区间和异常点处理，不能由语言模型直接编造结果。',role:'历史附件中提出了软件目标、分析类型、模块边界与报告要求。',solution:['先以规则将自然语言映射为分析计划，再由确定性算法产生指标。','保留源文件、参数与清洗说明，分别分析升降温过程和稳态等待。','将图表、计算结果与结论关联，为后续桌面打包和服务化预留接口。'],evidence:'123.zip 的附件保存了 LabReportAgent MVP 需求，聊天索引同时记录多次温控和实验报告相关工作。',boundary:'本次读取备份说明、附件与会话索引，未据此验证代码完成或运行成功。这里只作为产品化构想展示，未发布原始聊天。'}
];
const catalog = [
 ['P01','腐蚀性极细无机粉末自动加样系统','32 杯 / 9 动子 / 8 头；设备联调与现场复验，新 LabOS 模式单独验证'],['P02','液体配方工作站','服务与适配已实现；整站闭环待确认'],['P03','粉末调试 CLI / 八通道 HMI','真实接口与模拟模式分开'],['P04','固体站仿真与耐久 HMI','仿真计划不等于完成的耐久轮数'],['P05','16 瓶自动拧盖','流程与离线验证；整轮硬件验收有限'],['P06','极片振荡解叠工具','轨迹工具；工艺分离效果待实测'],['P07','双通道温控','基础控制分支；寄存器依设备核对'],['P08','多物性联合测试','多模式采集；互锁策略按模式区分'],['P09','热模型与离线分析','历史实验模型；不是普适精度认证'],['P10','气路、双泵与 GC','多分支流程；阀口及启动方式有区别'],['P11','电解水产气联测','仪器、压力与温控协调记录'],['P12','气密检漏与容积标定','泵与拟合程序；正式检漏验收不足'],['P13','真空箱与四腔室','上位机及部分运行记录'],['P14','Neware 数据闭环','历史短流程控制、上传与关联证据'],['P15','ERP 库存与借还','桌面与移动业务实现；规模未核实'],['P16','Lab Agent 泵控原型','仿真与真实适配器；实机端到端待证实'],['P17','密闭加料机械概念','CAD 与受力边界；制造待验证'],['P18','参数化外壳与造型','几何交换与检查；试装待验证'],['P19','双板 BLE 手表方案','连接、BOM 与布局；无制板闭环'],['P20','极片工艺与设计储备','方案材料；不计为已完成设备']
];
const hexapod = {id:'hexapod',category:'mechanical',title:'六足机器人参数化机械设计',problem:'以既有舵机和控制系统为基础，解决打印腿架连接微动、螺母难装与模块化机身维护。',role:'本人负责需求取舍、现有硬件接口确认、打印试装与反馈；使用 AI 辅助参数化模型和检查脚本生成。第三方参考结构与库保留来源边界。',solution:['三关节腿与近圆形分段机身，驱动侧金属舵盘和反侧 695 轴承形成双侧支撑。','早期试装定位腿架—舵盘晃动，确认中心 M3 螺纹与深度，迭代贴合承台及压紧结构。','螺母槽在实体合并后重切，分别检查装入路径、螺丝长度、自由面距离和 STEP 回读。','后续 V15 只改机身翻装与减重，文档标为首件试装候选，控制参数须重新标定。'],evidence:'2026-09-11 V12 作品集记载 18 项接口回归、含 STEP 回读的 465 项检查、82 个单腿采样姿态；这些范围有包含关系，不能简单相加。单腿记录最小自由面间隙约 2.1 mm。',boundary:'早期零件有实物试装照片，V12 新接口仍待复验。几何采样不是连续全域碰撞证明，也不证明载荷与行走。V13 有限元属于未标定材料近似，V15 仍为候选，不采用其结果作为整机承载认证。'};
const grid = document.querySelector('#project-grid');
const search = document.querySelector('#search');
const dialog = document.querySelector('#project-dialog');
let filter = 'all';
let lastOpener = null;
function escapeHtml(value){return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const solidVideoLink = '<a class="text-link solid-video-link" href="solid-station/index.html">观看三维仿真视频 ↗</a>';
function render(){
 const query=search.value.trim().toLowerCase();
 const visible=projects.filter(p=>(filter==='all'||p.category===filter)&&`${p.title} ${p.summary} ${p.tags.join(' ')} ${p.state}`.toLowerCase().includes(query));
 grid.innerHTML=visible.map(p=>`<article class="project-card"><div class="card-top"><span class="category">${categories[p.category]}</span><span>PROJECT STUDY</span></div><h3>${p.title}</h3><p>${p.summary}</p><div class="card-tags">${p.tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div><div class="card-state">${p.state}</div><button class="text-link" data-project="${p.id}" aria-label="查看${p.title}详情">问题、方案与验证 ↗</button>${p.id === 'solid' ? solidVideoLink : ''}</article>`).join('');
 document.querySelector('#result-label').textContent=`${visible.length} 项精选案例 · 另有六足机器人重点项目与完整项目地图`;
 document.querySelector('#empty').hidden=visible.length>0;
}
function openProject(p,opener){
 lastOpener=opener;
 document.querySelector('#dialog-category').textContent=categories[p.category]+' / PROJECT DETAIL';
 document.querySelector('#dialog-title').textContent=p.title;
 document.querySelector('#dialog-content').innerHTML=`${p.id === 'solid' ? '<p>' + solidVideoLink + '</p>' : ''}<h3>要解决的问题</h3><p>${escapeHtml(p.problem)}</p><h3>本人职责</h3><p>${escapeHtml(p.role)}</p><h3>方案与实现</h3><ul>${p.solution.map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul>${p.id==='hexapod'?'<p><a class="text-link" href="hexapod/index.html">打开六足三维互动模型 ↗</a></p><img src="assets/image4.jpg" alt="早期打印关节实物试装照片，非V12整机完成照片"><p>早期打印试装实物照片。CAD 展示与实物状态分开说明。</p>':''}<h3>验证依据</h3><p>${escapeHtml(p.evidence)}</p><h3>当前边界</h3><p class="boundary">${escapeHtml(p.boundary)}</p>`;
 dialog.showModal();dialog.scrollTop=0;
}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});render();}));
search.addEventListener('input',render);
document.addEventListener('click',event=>{const button=event.target.closest('[data-project]');if(!button)return;const p=button.dataset.project==='hexapod'?hexapod:projects.find(item=>item.id===button.dataset.project);if(p)openProject(p,button);});
document.querySelectorAll('.close,.close-bottom').forEach(button=>button.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('close',()=>{if(lastOpener)lastOpener.focus({preventScroll:true});});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.querySelector('#catalog-body').innerHTML=catalog.map(row=>`<tr>${row.map(cell=>`<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
document.querySelector('#sources-button').addEventListener('click',event=>{
 lastOpener=event.currentTarget;document.querySelector('#dialog-category').textContent='SOURCES / 内容与参考';document.querySelector('#dialog-title').textContent='真实资料，明确范围';
 document.querySelector('#dialog-content').innerHTML='<h3>个人与项目资料</h3><p>简历、六足机器人设计作品集和项目验证记录。</p><h3>GitHub 开源参考</h3><p><a class="text-link" href="https://github.com/cobiwave/simplefolio" target="_blank" rel="noopener">Simplefolio ↗</a>：参考单页作品集组织方式；网页 HTML、CSS 与交互代码为本次编写，未复制该模板源码。</p><p><a class="text-link" href="https://github.com/gumyr/build123d" target="_blank" rel="noopener">build123d ↗</a>：项目采用的参数化 CAD 技术参考，并非本人的开源仓库。</p><h3>阅读说明</h3><p class="boundary">历史数字按资料来源与版本归因，本次未重新执行设备实验或审计全部源码。聊天记录仅用于提炼相关方向，不公开原始会话、设备网络地址、凭据、业务数据库或企业源码。LabReportAgent 是需求构想，不能写成已交付产品。</p>';
 dialog.showModal();dialog.scrollTop=0;
});
render();

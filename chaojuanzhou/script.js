const SCENES = [
    {
        title: '安吉余村',
        copy: '水墨江南，绿水绕村',
        image: '../images/01-anjiyucun-qingshanbianjinshan.png',
        accent: '#80b96c'
    },
    {
        title: '淳安下姜村',
        copy: '廊桥卧波，绿富同兴',
        image: '../images/02-chunanxiajiangcun-mengkaishidedifang.png',
        accent: '#62bcae'
    },
    {
        title: '杭州西溪湿地',
        copy: '芦花飞雪，曲水寻梅',
        image: '../images/03-hangzhouxixishidi-chengshizhifeihuxi.png',
        accent: '#c9a24d'
    },
    {
        title: '鞍钢矿山',
        copy: '深坑育果，大地回春',
        image: '../images/04-angangkuangshanliaoning-feikuangpilvzhuang.png',
        accent: '#d18a53'
    },
    {
        title: '北京首钢园',
        copy: '钢炉静默，碧水潺潺',
        image: '../images/05-beijingshougangyuan-tieserongxinlv.png',
        accent: '#c76f4e'
    },
    {
        title: '安吉矿坑',
        copy: '砚瓦成池，文润青山',
        image: '../images/06-anjikuangkengguojiabanbenguan-shibizangshuyun.png',
        accent: '#3aa38d'
    },
    {
        title: '塞罕坝',
        copy: '松涛阵阵，绿锁黄龙',
        image: '../images/07-saihanbahebei-huangyuanqilinhai.png',
        accent: '#6ea85c'
    },
    {
        title: '三北防护林',
        copy: '林进沙退，山河重塑',
        image: '../images/08-sanbeifanghulin-suozhuliushaxian.png',
        accent: '#d5ad54'
    },
    {
        title: '福建长汀',
        copy: '红土生金，花果飘香',
        image: '../images/09-fujianchangting-huoyanshanfulv.png',
        accent: '#cf7248'
    },
    {
        title: '长江',
        copy: '碧水东流，岸芷汀兰',
        image: '../images/10-changjianghubeijiangxiduan-bishuiraoxinan.png',
        accent: '#58a9ce'
    },
    {
        title: '德清湿地',
        copy: '万顷芦荡，鹤影栖霞',
        image: '../images/11-deqingshidizhejiang-shidiliantianjing.png',
        accent: '#d2ba7b'
    },
    {
        title: '云和梯田',
        copy: '层层叠玉，金鸡报晓',
        image: '../images/12-yunhetitian-yunduangenglvhua.png',
        accent: '#f1b45e'
    }
];

const QUOTES = [
    '绿水青山就是金山银山',
    '生态兴则文明兴',
    '绿水逶迤去，青山相向开',
    '草木植成，国之富也；山水常绿，民之幸也',
    '中国的绿色行动，是"独善其身"，更是"兼济天下"',
    '人不负青山，青山定不负人'
];

const JOURNEY = [];
SCENES.forEach((scene, sceneIndex) => {
    if (sceneIndex % 2 === 0) {
        JOURNEY.push({
            type: 'text',
            text: QUOTES[sceneIndex / 2],
            quoteIndex: sceneIndex / 2
        });
    }

    JOURNEY.push({
        type: 'card',
        scene,
        sceneIndex
    });
});

const CONFIG = {
    zGap: 760,
    camSpeed: 2.15,
    exitGap: 1900,
    wheelScale: 1.05,
    touchScale: 1.6,
    keyboardStep: 680,
    introScrollRatio: 1.15,
    introScrollMin: 760,
    outroScrollRatio: 1.35,
    outroScrollMin: 900
};

const state = {
    scroll: 0,
    targetScroll: 0,
    velocity: 0,
    mouseX: 0,
    mouseY: 0,
    maxScroll: 0,
    introScroll: 0,
    outroScroll: 0,
    outroProgress: 0,
    maskMouseX: window.innerWidth / 2,
    maskMouseY: window.innerHeight / 2,
    maskGlowX: window.innerWidth / 2,
    maskGlowY: window.innerHeight / 2,
    lastTouchY: 0
};

const world = document.getElementById('world');
const viewport = document.getElementById('viewport');
const introMask = document.getElementById('introMask');
const introMaskCursorGlow = document.getElementById('introMaskCursorGlow');
const outroPanel = document.getElementById('outroPanel');
const outroLines = outroPanel ? Array.from(outroPanel.querySelectorAll('.outro-copy p')) : [];
const creditSection = document.getElementById('creditSection');
const scrollProxy = document.querySelector('.scroll-proxy');
const coordinateTrigger = document.querySelector('.coordinate-trigger');
const coordinateInfoCard = document.getElementById('coordinateInfoCard');
const items = [];
let regionMapChart = null;
let activeRegionName = '';

// Province name to pinyin filename mapping (for dynamic image loading)
const provinceToPinyin = {
  '北京市': 'beijingshi',
  '天津市': 'tianjinshi',
  '河北省': 'hebeisheng',
  '山西省': 'shanxisheng',
  '内蒙古自治区': 'neimengguzizhiqu',
  '辽宁省': 'liaoningsheng',
  '吉林省': 'jilinsheng',
  '黑龙江省': 'heilongjiangsheng',
  '上海市': 'shanghaishi',
  '江苏省': 'jiangsusheng',
  '浙江省': 'zhejiangsheng',
  '安徽省': 'anhuisheng',
  '福建省': 'fujiansheng',
  '江西省': 'jiangxisheng',
  '山东省': 'shandongsheng',
  '河南省': 'henansheng',
  '湖北省': 'hubeisheng',
  '湖南省': 'hunansheng',
  '广东省': 'guangdongsheng',
  '广西壮族自治区': 'guangxizhuangzuzizhiqu',
  '海南省': 'hainansheng',
  '重庆市': 'chongqingshi',
  '四川省': 'sichuansheng',
  '贵州省': 'guizhousheng',
  '云南省': 'yunnansheng',
  '西藏自治区': 'xizangzizhiqu',
  '陕西省': 'shaanxisheng',
  '甘肃省': 'gansusheng',
  '青海省': 'qinghaisheng',
  '宁夏回族自治区': 'ningxiahuizuzizhiqu',
  '新疆维吾尔自治区': 'xinjiangweiwuerzizhiqu',
  '台湾省': 'taiwansheng',
  '香港特别行政区': 'xianggangtebiexingzhengqu',
  '澳门特别行政区': 'aomentebiexingzhengqu',
};

const REGION_MAP_DATA = [
    { name: '北京市', short: '北京', value: 98,   ecoDemo: 6,  twoMountains: 8,  total: 14, tagline: '钢铁与青山的和解，从首钢园开始' },
    { name: '天津市', short: '天津', value: 42,   ecoDemo: 5,  twoMountains: 5,  total: 10, tagline: '九河入海处，绿意润津门' },
    { name: '河北省', short: '河北', value: 62,   ecoDemo: 19, twoMountains: 9,  total: 28, tagline: '塞罕坝的松涛，是荒原对未来的承诺' },
    { name: '山西省', short: '山西', value: 68,   ecoDemo: 16, twoMountains: 8,  total: 24, tagline: '黑金褪去，绿染山河——每一种转型都需要勇气' },
    { name: '内蒙古自治区', short: '内蒙古', value: 38, ecoDemo: 18, twoMountains: 8,  total: 26, tagline: '草原辽阔处，绿色是永恒的信仰' },
    { name: '辽宁省', short: '辽宁', value: 55,   ecoDemo: 16, twoMountains: 7,  total: 23, tagline: '深坑育果，大地回春——每一寸废矿都能重生' },
    { name: '吉林省', short: '吉林', value: 40,   ecoDemo: 15, twoMountains: 8,  total: 23, tagline: '白山松水间，守护是最长情的告白' },
    { name: '黑龙江省', short: '黑龙江', value: 48, ecoDemo: 14, twoMountains: 7,  total: 21, tagline: '林海雪原之下，是万物生长的根基' },
    { name: '上海市', short: '上海', value: 72,   ecoDemo: 4,  twoMountains: 4,  total: 8,  tagline: '寸土寸金处，亦有绿意栖居' },
    { name: '江苏省', short: '江苏', value: 118,  ecoDemo: 34, twoMountains: 11, total: 45, tagline: '水韵江南，每一滴碧水都是乡愁' },
    { name: '浙江省', short: '浙江', value: 112,  ecoDemo: 53, twoMountains: 16, total: 69, tagline: '从余村出发——绿水青山就是金山银山' },
    { name: '安徽省', short: '安徽', value: 78,   ecoDemo: 25, twoMountains: 12, total: 37, tagline: '徽风皖韵里，人与自然相看两不厌' },
    { name: '福建省', short: '福建', value: 85,   ecoDemo: 49, twoMountains: 13, total: 62, tagline: '红土生金，花果飘香——长汀告诉世界' },
    { name: '江西省', short: '江西', value: 75,   ecoDemo: 31, twoMountains: 13, total: 44, tagline: '匡庐奇秀处，人与自然共和谐' },
    { name: '山东省', short: '山东', value: 95,   ecoDemo: 36, twoMountains: 14, total: 50, tagline: '一山一水一圣人，绿染齐鲁万象新' },
    { name: '河南省', short: '河南', value: 82,   ecoDemo: 22, twoMountains: 9,  total: 31, tagline: '大河之南，文明的底色是绿色' },
    { name: '湖北省', short: '湖北', value: 88,   ecoDemo: 30, twoMountains: 11, total: 41, tagline: '千湖之省，碧水为魂——每一条河流都是命脉' },
    { name: '湖南省', short: '湖南', value: 80,   ecoDemo: 26, twoMountains: 10, total: 36, tagline: '芙蓉国里尽朝晖，绿水青山是归处' },
    { name: '广东省', short: '广东', value: 92,   ecoDemo: 37, twoMountains: 12, total: 49, tagline: '岭南绿韵长，敢为人先亦是生态先行' },
    { name: '广西壮族自治区', short: '广西', value: 60, ecoDemo: 16, twoMountains: 8,  total: 24, tagline: '八桂大地，山清水秀是自然的馈赠' },
    { name: '海南省', short: '海南', value: 45,   ecoDemo: 10, twoMountains: 7,  total: 17, tagline: '南海之珠，绿色是最美的底色' },
    { name: '重庆市', short: '重庆', value: 65,   ecoDemo: 11, twoMountains: 8,  total: 19, tagline: '山城雾都，两江四岸皆春色' },
    { name: '四川省', short: '四川', value: 105,  ecoDemo: 43, twoMountains: 14, total: 57, tagline: '天府之国，万物并育而不相害' },
    { name: '贵州省', short: '贵州', value: 58,   ecoDemo: 17, twoMountains: 12, total: 29, tagline: '黔山秀水间，绿色是最坚定的选择' },
    { name: '云南省', short: '云南', value: 72,   ecoDemo: 23, twoMountains: 13, total: 36, tagline: '彩云之南，万物共生是自然的法则' },
    { name: '西藏自治区', short: '西藏', value: 35, ecoDemo: 11, twoMountains: 7,  total: 18, tagline: '雪域高原，每一寸都是生态的圣殿' },
    { name: '陕西省', short: '陕西', value: 88,   ecoDemo: 20, twoMountains: 11, total: 31, tagline: '秦川八百里，绿染黄土是时间的力量' },
    { name: '甘肃省', short: '甘肃', value: 62,   ecoDemo: 14, twoMountains: 8,  total: 22, tagline: '大漠孤烟直，绿洲生金来' },
    { name: '青海省', short: '青海', value: 32,   ecoDemo: 9,  twoMountains: 7,  total: 16, tagline: '三江之源，中华水塔——每一滴水都是承诺' },
    { name: '宁夏回族自治区', short: '宁夏', value: 28, ecoDemo: 8,  twoMountains: 6,  total: 14, tagline: '塞上江南，绿洲是荒漠里的答案' },
    { name: '新疆维吾尔自治区', short: '新疆', value: 50, ecoDemo: 15, twoMountains: 7,  total: 22, tagline: '天山南北，绿洲如珠是坚持的力量' },
    { name: '新疆生产建设兵团', short: '兵团', value: 30, ecoDemo: 4,  twoMountains: 5,  total: 9,  tagline: '戈壁深处，绿色是最硬的脊梁' },
    { name: '台湾省', short: '台湾', value: 50, tagline: '宝岛青山在，绿水绕蓬瀛' },
    { name: '香港特别行政区', short: '香港', value: 50, tagline: '东方之珠，山海皆含翠' },
    { name: '澳门特别行政区', short: '澳门', value: 50, tagline: '濠江碧波暖，绿意满城芳' },
    { name: '南海诸岛', short: '南海诸岛', value: 20, highlight: true, tagline: '碧海蓝天间，珊瑚生息处' }
];

const REGION_PIECES = [
    { min: 100, max: 130, label: '核心文旅聚集区', color: '#1E4D5C' },
    { min: 82, max: 99, label: '文旅资源密集区', color: '#2B6580' },
    { min: 64, max: 81, label: '文旅资源丰富区', color: '#3A7CA5' },
    { min: 48, max: 63, label: '文旅资源较丰区', color: '#5A9A8A' },
    { min: 34, max: 47, label: '文旅资源发展区', color: '#7BA87E' },
    { min: 20, max: 33, label: '文旅潜力区', color: '#C8DCC8' }
];

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function smootherstep(value) {
    const t = clamp(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function regionLevel(value) {
    const piece = REGION_PIECES.find((item) => value >= item.min && value <= item.max);
    return piece ? piece.label : '文旅资源观察区';
}

async function initRegionMapBackground() {
    const mapEl = document.getElementById('regionMapBg');
    console.log("[Map] initRegionMapBackground", {mapEl: !!mapEl, echarts: !!window.echarts});
    if (!mapEl || !window.echarts) {
        console.warn("[Map] Cannot init - mapEl:", !!mapEl, "echarts:", !!window.echarts);
        return;
    }

    regionMapChart = echarts.init(mapEl, null, { renderer: 'canvas' });
    regionMapChart.showLoading({
        text: '加载中国地图...',
        color: '#3A7CA5',
        textColor: '#49635c',
        maskColor: 'rgba(246, 241, 229, 0.72)'
    });

    try {
        const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
        const geoJson = await response.json();
        echarts.registerMap('china', geoJson);
        regionMapChart.hideLoading();

        regionMapChart.setOption({
            backgroundColor: 'transparent',
            animationDuration: 700,
            animationEasing: 'cubicOut',
            tooltip: {
                trigger: 'item',
                appendToBody: true,
                confine: true,
                backgroundColor: 'rgba(30,77,92,0.94)',
                borderColor: 'rgba(201, 220, 200, 0.48)',
                borderWidth: 1,
                padding: [12, 15],
                extraCssText: 'border-radius:12px;box-shadow:0 16px 44px rgba(0,0,0,0.24);z-index:60;font-family:"Microsoft YaHei",sans-serif;',
                formatter(params) {
                    const region = REGION_MAP_DATA.find((item) => item.name === params.name);
                    if (!region) return `<strong>${params.name}</strong>`;

                    const hasEco = region.total !== undefined;

                    return `
                        <div style="min-width:184px;max-width:220px;">
                            <div style="font-size:17px;font-weight:800;color:#e8d48c;margin-bottom:2px;">${region.short}</div>
                            ${region.tagline ? `
                            <div style="font-size:12px;color:rgba(232,212,140,0.78);font-style:italic;margin-bottom:8px;border-left:2px solid rgba(232,212,140,0.3);padding-left:8px;line-height:1.5;">
                                ${region.tagline}
                            </div>` : ''}
                            ${hasEco ? `
                            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:5px;font-size:11px;">
                                <span style="background:rgba(255,255,255,0.1);border-radius:4px;padding:2px 7px;color:rgba(255,255,255,0.7);">
                                    示范区 <strong style="color:#7bd2c2;">${region.ecoDemo}</strong>
                                </span>
                                <span style="background:rgba(255,255,255,0.1);border-radius:4px;padding:2px 7px;color:rgba(255,255,255,0.7);">
                                    两山基地 <strong style="color:#d9b86c;">${region.twoMountains}</strong>
                                </span>
                                <span style="background:rgba(255,255,255,0.1);border-radius:4px;padding:2px 7px;color:rgba(255,255,255,0.7);">
                                    合计 <strong style="color:#ffffff;">${region.total}</strong>
                                </span>
                            </div>` : ''}

                        </div>
                    `;
                }
            },
            visualMap: {
                type: 'piecewise',
                show: false,
                left: 28,
                bottom: 26,
                itemWidth: 24,
                itemHeight: 13,
                itemGap: 8,
                selectedMode: false,
                hoverLink: true,
                textStyle: {
                    color: 'rgba(26, 45, 39, 0.68)',
                    fontSize: 12,
                    fontWeight: 500
                },
                pieces: REGION_PIECES
            },
            geo: {
                map: 'china',
                roam: false,
                aspectScale: 0.75,
                layoutCenter: ['50%', '62%'],
                layoutSize: window.innerWidth <= 700 ? '126%' : '118%',
                regions: [{
                    name: '南海诸岛',
                    itemStyle: {
                        areaColor: '#1B5668',
                        borderColor: '#BFE8C8',
                        borderWidth: 2,
                        shadowColor: 'rgba(27, 86, 104, 0.34)',
                        shadowBlur: 12
                    },
                    emphasis: {
                        itemStyle: {
                            areaColor: '#0F3F4F',
                            borderColor: '#DDF6E3',
                            borderWidth: 2.6,
                            shadowColor: 'rgba(15, 63, 79, 0.48)',
                            shadowBlur: 18
                        }
                    }
                }],
                label: { show: false },
                itemStyle: {
                    areaColor: '#F5F0E6',
                    borderColor: 'rgba(255, 255, 255, 0.78)',
                    borderWidth: 0.8
                },
                emphasis: {
                    label: {
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 13
                    },
                    itemStyle: {
                        areaColor: '#3A7CA5',
                        borderColor: '#1E4D5C',
                        borderWidth: 2,
                        shadowColor: 'rgba(30,77,92,0.35)',
                        shadowBlur: 18
                    }
                }
            },
            series: [{
                name: '文旅资源丰度',
                type: 'map',
                map: 'china',
                geoIndex: 0,
                roam: false,
                selectedMode: false,
                data: REGION_MAP_DATA.map((region) => ({
                    name: region.name,
                    value: region.value,
                    itemStyle: region.highlight ? {
                        areaColor: '#1B5668',
                        borderColor: '#BFE8C8',
                        borderWidth: 2,
                        shadowColor: 'rgba(27, 86, 104, 0.34)',
                        shadowBlur: 12
                    } : undefined,
                    emphasis: region.highlight ? {
                        itemStyle: {
                            areaColor: '#0F3F4F',
                            borderColor: '#DDF6E3',
                            borderWidth: 2.6,
                            shadowColor: 'rgba(15, 63, 79, 0.48)',
                            shadowBlur: 18
                        }
                    } : undefined
                }))
            }]
        });

        regionMapChart.on('click', (params) => {
            if (!params.name) return;
            if (activeRegionName) {
                regionMapChart.dispatchAction({
                    type: 'downplay',
                    seriesIndex: 0,
                    name: activeRegionName
                });
            }
            activeRegionName = params.name;
            regionMapChart.dispatchAction({
                type: 'highlight',
                seriesIndex: 0,
                name: params.name
            });
            regionMapChart.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                name: params.name
            });
            openRegionLightbox(params.name);
        });
    } catch (error) {
        regionMapChart.hideLoading();
        console.error("[Map] ",'地图加载失败', error);
    }
}

function updateMaxScroll() {
    const finalDepth = (JOURNEY.length - 1) * CONFIG.zGap + CONFIG.exitGap;
    state.maxScroll = Math.ceil(finalDepth / CONFIG.camSpeed);
    state.introScroll = Math.ceil(Math.max(window.innerHeight * CONFIG.introScrollRatio, CONFIG.introScrollMin));
    state.outroScroll = Math.ceil(Math.max(window.innerHeight * CONFIG.outroScrollRatio, CONFIG.outroScrollMin));
    if (scrollProxy) {
        scrollProxy.style.height = `${state.introScroll + state.maxScroll + state.outroScroll + window.innerHeight}px`;
    }
}

function pageMaxScroll() {
    return state.introScroll + state.maxScroll + state.outroScroll;
}

function setTargetScroll(value) {
    state.targetScroll = clamp(value, 0, state.maxScroll);
}

function updateIntroMask(pageScroll = window.scrollY) {
    if (!introMask) return;

    const progress = state.introScroll > 0 ? clamp(pageScroll / state.introScroll, 0, 1) : 1;
    const opacity = 1 - smootherstep(progress);
    introMask.style.setProperty('--intro-opacity', opacity.toFixed(3));
    introMask.style.setProperty('--intro-content-y', `${((1 - progress) * 18).toFixed(2)}px`);
    introMask.classList.toggle('is-hidden', progress >= 1);
    introMask.setAttribute('aria-hidden', String(progress >= 1));
}

function updateOutro(pageScroll = window.scrollY) {
    const outroStart = state.introScroll + state.maxScroll;
    const rawProgress = state.outroScroll > 0 ? clamp((pageScroll - outroStart) / state.outroScroll, 0, 1) : 0;
    const liftProgress = smootherstep(rawProgress);
    const copyProgress = smootherstep((rawProgress - 0.12) / 0.78);
    const liftDistance = Math.min(Math.max(window.innerHeight * 1.1, 760), 1220);
    const copyY = (1 - copyProgress) * 58;

    state.outroProgress = rawProgress;
    document.body.style.setProperty('--outro-lift', `${(-liftDistance * liftProgress).toFixed(2)}px`);
    document.body.style.setProperty('--outro-progress', copyProgress.toFixed(3));
    document.body.style.setProperty('--outro-copy-y', `${copyY.toFixed(2)}px`);
    outroLines.forEach((line, index) => {
        const lineProgress = smootherstep((rawProgress - (0.16 + index * 0.105)) / 0.34);
        line.style.setProperty('--line-progress', lineProgress.toFixed(3));
        line.style.setProperty('--line-y', `${((1 - lineProgress) * 28).toFixed(2)}px`);
    });
    if (outroPanel) {
        outroPanel.setAttribute('aria-hidden', String(copyProgress <= 0.02));
    }

    /* ── 制作者 & 指导老师 平滑浮现 ── */
    if (creditSection) {
        const creditProgress = smootherstep((rawProgress - 0.72) / 0.28);
        creditSection.style.setProperty('--credit-opacity', creditProgress.toFixed(3));
        creditSection.style.setProperty('--credit-y', `${((1 - creditProgress) * 36).toFixed(2)}px`);
    }
}

function syncScrollStateFromPage(pageScroll = window.scrollY) {
    setTargetScroll(pageScroll - state.introScroll);
    updateIntroMask(pageScroll);
    updateOutro(pageScroll);
}

function scrollToPagePosition(value) {
    const next = clamp(value, 0, pageMaxScroll());
    window.scrollTo({ top: next, left: 0, behavior: 'auto' });
    syncScrollStateFromPage(next);
}

function scrollToProgress(value) {
    const next = clamp(value, 0, state.maxScroll);
    scrollToPagePosition(state.introScroll + next);
}

function addScrollDelta(delta) {
    scrollToPagePosition(window.scrollY + delta);
}

function scenePosition(sceneIndex) {
    const spreadX = Math.min(window.innerWidth * 0.28, 430);
    const spreadY = Math.min(window.innerHeight * 0.24, 250);
    const pattern = [
        [-0.9, -0.18, -7],
        [0.88, 0.22, 6],
        [-0.42, 0.34, 8],
        [0.5, -0.34, -5],
        [-0.72, 0.08, 4],
        [0.74, -0.02, -8]
    ];
    const [px, py, rot] = pattern[sceneIndex % pattern.length];

    return {
        x: px * spreadX,
        y: py * spreadY,
        rot
    };
}

function quotePosition(quoteIndex) {
    const drift = quoteIndex % 2 === 0 ? -1 : 1;
    const driftX = window.innerWidth <= 700 ? 0 : Math.min(window.innerWidth * 0.08, 110);

    return {
        x: drift * driftX,
        y: (quoteIndex % 3 - 1) * Math.min(window.innerHeight * 0.1, 86),
        rot: drift * 1.2
    };
}

function makeCard(scene, sceneIndex) {
    const card = document.createElement('article');
    card.className = 'card';
    card.style.setProperty('--scene-accent', scene.accent);
    card.setAttribute('aria-label', `${scene.title}：${scene.copy}`);
    card.innerHTML = `
        <img class="card-image" src="${scene.image}" alt="${scene.title}">
        <div class="card-copy">
            <span class="card-kicker">生态样本 ${String(sceneIndex + 1).padStart(2, '0')}</span>
            <span class="card-line">${scene.title}：${scene.copy}</span>
        </div>
        <span class="card-index">${String(sceneIndex + 1).padStart(2, '0')}</span>
    `;

    return card;
}

function makeQuote(text) {
    const quote = document.createElement('div');
    quote.className = 'big-text';
    quote.textContent = text;
    return quote;
}

function setCoordinateCardOpen(isOpen) {
    if (!coordinateTrigger || !coordinateInfoCard) return;

    coordinateTrigger.classList.toggle('is-active', isOpen);
    coordinateTrigger.setAttribute('aria-expanded', String(isOpen));
    coordinateInfoCard.classList.toggle('is-open', isOpen);
    coordinateInfoCard.setAttribute('aria-hidden', String(!isOpen));
}

function bindCoordinateInfo() {
    if (!coordinateTrigger || !coordinateInfoCard) return;

    coordinateTrigger.addEventListener('click', (event) => {
        event.stopPropagation();
        setCoordinateCardOpen(!coordinateInfoCard.classList.contains('is-open'));
    });

    coordinateInfoCard.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    document.addEventListener('click', (event) => {
        if (!coordinateInfoCard.classList.contains('is-open')) return;
        if (coordinateTrigger.contains(event.target) || coordinateInfoCard.contains(event.target)) return;

        setCoordinateCardOpen(false);
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setCoordinateCardOpen(false);
        }
    });
}

/* ── 省份图片灯箱 ── */
function openRegionLightbox(regionName) {
    const region = REGION_MAP_DATA.find((item) => item.name === regionName);
    if (!region) return;

    var lb = document.getElementById('regionLightbox');
    var img = document.getElementById('regionLightboxImg');
    var cap = document.getElementById('regionLightboxCaption');
    var tag = document.getElementById('regionLightboxTagline');
    var eco = document.getElementById('regionLightboxEco');

    if (!lb || !img) return;

    // Use pinyin filename
			img.src = "../images/" + (provinceToPinyin[region.name] || region.name) + ".png";
    img.alt = region.short;

    cap.textContent = region.short;

    if (region.tagline) {
        tag.textContent = '「' + region.tagline + '」';
        tag.style.display = '';
    } else {
        tag.style.display = 'none';
    }

    if (region.total !== undefined) {
        eco.innerHTML =
            '<span>示范区 <strong class="num-eco">' + region.ecoDemo + '</strong></span>' +
            '<span>两山基地 <strong class="num-two">' + region.twoMountains + '</strong></span>' +
            '<span>合计 <strong class="num-total">' + region.total + '</strong></span>';
        eco.style.display = '';
    } else {
        eco.style.display = 'none';
    }

    lb.setAttribute('aria-hidden', 'false');
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closeRegionLightbox() {
    var lb = document.getElementById('regionLightbox');
    if (!lb) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function bindRegionLightbox() {
    var lb = document.getElementById('regionLightbox');
    if (!lb) return;

    var closeBtn = document.getElementById('regionLightboxClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () { closeRegionLightbox(); });
    }

    lb.addEventListener('click', function (e) {
        if (e.target === lb) closeRegionLightbox();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeRegionLightbox();
    });
}

function fitSingleLineText() {
    const lines = document.querySelectorAll('.big-text, .card-line');

    lines.forEach((line) => {
        line.style.fontSize = '';
        const minSize = line.classList.contains('big-text') ? 12 : 10;
        let size = parseFloat(getComputedStyle(line).fontSize);

        while (line.scrollWidth > line.clientWidth && size > minSize) {
            size -= 1;
            line.style.fontSize = `${size}px`;
        }
    });
}

function refreshLayout() {
    updateMaxScroll();
    if (window.scrollY > pageMaxScroll()) {
        scrollToPagePosition(pageMaxScroll());
    } else {
        syncScrollStateFromPage(window.scrollY);
    }

    items.forEach((item) => {
        if (item.type === 'card') {
            Object.assign(item, scenePosition(item.sceneIndex));
        }

        if (item.type === 'text') {
            Object.assign(item, quotePosition(item.quoteIndex));
        }
    });

    requestAnimationFrame(fitSingleLineText);
}

function initItems() {
    JOURNEY.forEach((entry, index) => {
        const el = document.createElement('div');
        el.className = 'item';

        if (entry.type === 'text') {
            const position = quotePosition(entry.quoteIndex);
            el.appendChild(makeQuote(entry.text));
            items.push({
                el,
                type: 'text',
                quoteIndex: entry.quoteIndex,
                baseZ: -index * CONFIG.zGap,
                ...position
            });
        }

        if (entry.type === 'card') {
            const position = scenePosition(entry.sceneIndex);
            el.appendChild(makeCard(entry.scene, entry.sceneIndex));
            items.push({
                el,
                type: 'card',
                sceneIndex: entry.sceneIndex,
                baseZ: -index * CONFIG.zGap,
                ...position
            });
        }

        world.appendChild(el);
    });
}

function bindInput() {
    window.addEventListener('scroll', () => {
        syncScrollStateFromPage(window.scrollY);
    }, { passive: true });

    window.addEventListener('keydown', (event) => {
        const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
        if (!keys.includes(event.key)) return;

        event.preventDefault();
        if (event.key === 'ArrowDown') addScrollDelta(CONFIG.keyboardStep * 0.45);
        if (event.key === 'ArrowUp') addScrollDelta(CONFIG.keyboardStep * -0.45);
        if (event.key === 'PageDown' || event.key === ' ') addScrollDelta(CONFIG.keyboardStep);
        if (event.key === 'PageUp') addScrollDelta(-CONFIG.keyboardStep);
        if (event.key === 'Home') scrollToPagePosition(0);
        if (event.key === 'End') scrollToPagePosition(pageMaxScroll());
    });

    window.addEventListener('mousemove', (event) => {
        state.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        state.mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
        state.maskMouseX = event.clientX;
        state.maskMouseY = event.clientY;
    });

    window.addEventListener('resize', () => {
        refreshLayout();
        if (regionMapChart) {
            regionMapChart.setOption({
                geo: { layoutSize: window.innerWidth <= 700 ? '126%' : '118%' }
            });
            regionMapChart.resize();
        }
    });
}

function renderItem(item, time, cameraZ) {
    const vizZ = item.baseZ + cameraZ;

    let alpha = 1;
    if (vizZ < -3600) alpha = 0;
    else if (vizZ < -2500) alpha = (vizZ + 3600) / 1100;
    if (vizZ > 120) alpha = 1 - ((vizZ - 120) / 420);
    alpha = clamp(alpha, 0, 1);

    item.el.style.opacity = alpha;
    item.el.style.pointerEvents = alpha > 0.05 ? 'auto' : 'none';

    if (alpha <= 0) {
        return;
    }

    let transform = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

    if (item.type === 'text') {
        transform += ` rotateZ(${item.rot}deg)`;
        item.el.style.setProperty('--quote-shift', `${Math.min(Math.abs(state.velocity) * 1.1, 12)}px`);
    }

    if (item.type === 'card') {
        const float = Math.sin(time * 0.001 + item.sceneIndex) * 6;
        transform += ` rotateZ(${item.rot}deg) rotateY(${float}deg)`;

        /* ── 卡片文字与图片独立渐隐 ── */
        const cardEl = item.el.querySelector('.card');
        if (cardEl) {
            let textAlpha = alpha;

            if (vizZ > 0) {
                /* 卡片接近相机——文字提前消退 */
                textAlpha = 1 - ((vizZ - 0) / 340);
            } else if (vizZ < -2900) {
                /* 卡片从远处进入——文字略晚显现 */
                textAlpha = (vizZ + 3200) / 300;
            }

            textAlpha = clamp(textAlpha, 0, 1);
            cardEl.style.setProperty('--card-text-opacity', textAlpha.toFixed(3));
            cardEl.style.setProperty('--card-img-opacity', alpha.toFixed(3));
        }
    }

    item.el.style.transform = transform;
}

function init() {
    updateMaxScroll();
    initItems();
    initRegionMapBackground();
    bindCoordinateInfo();
    bindRegionLightbox();
    bindInput();
    syncScrollStateFromPage();
    requestAnimationFrame(fitSingleLineText);
}

const feedbackVel = document.getElementById('vel-readout');
const feedbackFPS = document.getElementById('fps');
const feedbackCoord = document.getElementById('coord');
let lastTime = 0;
let lastFpsUpdate = 0;

function raf(time) {
    const delta = lastTime === 0 ? 16.7 : time - lastTime;
    lastTime = time;
    syncScrollStateFromPage(window.scrollY);

    const diff = state.targetScroll - state.scroll;
    state.scroll += diff * 0.16;
    if (Math.abs(diff) < 0.08) state.scroll = state.targetScroll;
    state.velocity += (diff - state.velocity) * 0.14;

    if (delta > 0 && time - lastFpsUpdate > 250) {
        if (feedbackFPS) feedbackFPS.textContent = Math.round(1000 / delta);
        lastFpsUpdate = time;
    }

    if (feedbackVel) feedbackVel.textContent = Math.abs(state.velocity).toFixed(2);
    if (feedbackCoord) feedbackCoord.textContent = `${Math.round(state.scroll)}`;

    const tiltX = state.mouseY * 3.2 - state.velocity * 0.018;
    const tiltY = state.mouseX * 3.2;

    if (introMaskCursorGlow) {
        state.maskGlowX += (state.maskMouseX - state.maskGlowX) * 0.08;
        state.maskGlowY += (state.maskMouseY - state.maskGlowY) * 0.08;
        introMaskCursorGlow.style.left = `${state.maskGlowX}px`;
        introMaskCursorGlow.style.top = `${state.maskGlowY}px`;
    }

    world.style.transform = `
        rotateX(${tiltX}deg)
        rotateY(${tiltY}deg)
    `;

    const fov = 1100 - Math.min(Math.abs(state.velocity) * 0.42, 470);
    viewport.style.perspective = `${fov}px`;

    const cameraZ = state.scroll * CONFIG.camSpeed;
    items.forEach((item) => renderItem(item, time, cameraZ));

    requestAnimationFrame(raf);
}

init();
requestAnimationFrame(raf);

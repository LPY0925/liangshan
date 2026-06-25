(function () {
	"use strict";
	let velocity = 0;
	const ease = 0.12;
	const friction = 0.92;
	const storyCompleteAnchor = 0.22;
	const sections = document.querySelectorAll(".scroll-section");
	const sectionsLen = sections.length;
	const wrappers = [];
	const comparatorData = [];
	let i, s, w, c, p;

	function parseStoryCopy() {
		const source = document.getElementById("story-copy");
		if (!source) return [];

		const chapters = [];
		const lines = source.textContent.replace(/\r/g, "").split("\n");
		let currentChapter = null;
		let paragraph = [];

		function flushParagraph() {
			if (!currentChapter || !paragraph.length) return;
			currentChapter.paragraphs.push(paragraph.join(""));
			paragraph = [];
		}

		for (const rawLine of lines) {
			const line = rawLine.trim();

			if (!line) {
				flushParagraph();
				continue;
			}

			if (line === "---") continue;

			if (line.startsWith("## ")) {
				flushParagraph();
				currentChapter = {
					heading: line.replace(/^##\s+/, ""),
					stat: "",
					paragraphs: []
				};
				chapters.push(currentChapter);
				continue;
			}

			if (line.startsWith("### ")) {
				if (currentChapter) {
					currentChapter.stat = line.replace(/^###\s+/, "");
				}
				continue;
			}

			paragraph.push(line);
		}

		flushParagraph();
		return chapters;
	}

	function appendStoryBlock(parent, paragraphs, isEmphasis) {
		if (!paragraphs.length) return;

		const block = document.createElement("div");
		block.className = isEmphasis
			? "story-block story-block--emphasis"
			: "story-block";

		for (const text of paragraphs) {
			const paragraphEl = document.createElement("p");

			if (isEmphasis) {
				const strong = document.createElement("strong");
				strong.textContent = text;
				paragraphEl.appendChild(strong);
			} else {
				paragraphEl.textContent = text;
			}

			block.appendChild(paragraphEl);
		}

		parent.appendChild(block);
	}

	function hydrateStoryPanels() {
		const chapters = parseStoryCopy();
		const panels = document.querySelectorAll(".story-panel");

		panels.forEach((panel) => {
			const chapter = chapters[Number(panel.dataset.chapterIndex)];
			if (!chapter) return;

			const headingParts = chapter.heading.split("｜");
			const kicker = headingParts[0] || "";
			const title = headingParts.slice(1).join("｜") || chapter.heading;
			const header = document.createElement("header");
			header.className = "story-head";

			const kickerEl = document.createElement("p");
			kickerEl.className = "story-kicker";
			kickerEl.textContent = kicker;

			const titleEl = document.createElement("h1");
			titleEl.className = "story-title";
			titleEl.textContent = title;

			const statEl = document.createElement("p");
			statEl.className = "story-stat";
			const statParts = chapter.stat.split("：");
			if (statParts.length > 1) {
				const statLabel = document.createElement("span");
				statLabel.className = "story-stat-label";
				statLabel.textContent = statParts.shift() + "：";

				const statValue = document.createElement("span");
				statValue.className = "story-stat-value";
				statValue.textContent = statParts.join("：");

				statEl.append(statLabel, statValue);
			} else {
				statEl.textContent = chapter.stat;
			}

			header.append(kickerEl, titleEl, statEl);

			const body = document.createElement("div");
			body.className = "story-body";
			let groupedParagraphs = [];

			chapter.paragraphs.forEach((rawParagraph) => {
				const isEmphasis =
					rawParagraph.startsWith("**") && rawParagraph.endsWith("**");

				if (isEmphasis) {
					appendStoryBlock(body, groupedParagraphs, false);
					groupedParagraphs = [];
					appendStoryBlock(
						body,
						[rawParagraph.slice(2, -2)],
						true
					);
					return;
				}

				groupedParagraphs.push(rawParagraph);
				if (groupedParagraphs.length === 2) {
					appendStoryBlock(body, groupedParagraphs, false);
					groupedParagraphs = [];
				}
			});

			appendStoryBlock(body, groupedParagraphs, false);
			panel.replaceChildren(header, body);
		});
	}

	const svgNS = "http://www.w3.org/2000/svg";
	const chartSize = { width: 1000, height: 620 };
	const chartPlot = { left: 82, top: 46, right: 950, bottom: 520 };

	const chartColors = {
		green: "#80ba98",
		greenLine: "#2d6647",
		greenDark: "#155c3f",
		gold: "#d5aa42",
		red: "#b74738",
		blue: "#3f7ebd",
		orange: "#c98c37"
	};

	const chartData = {
		forest: {
			title: "中国森林覆盖率演进，2003—2025",
			subtitle: "历次森林资源清查与公开年度节点",
			note: "悬停查看具体数值，点击折线节点可锁定年份。",
			source: "来源：国家林草局森林资源清查、林草保护发展规划及全国林业和草原工作会议。",
			series: {
				forest: [
					{ year: 2003, value: 18.21 },
					{ year: 2008, value: 20.36 },
					{ year: 2013, value: 21.63 },
					{ year: 2018, value: 22.96 },
					{ year: 2020, value: 23.04 },
					{ year: 2025, value: 25.09 }
				]
			}
		},
		pm25: {
			title: "全国 PM2.5 年均浓度变化，2015—2025",
			subtitle: "全国地级及以上城市年平均浓度，单位：微克/立方米",
			note: "悬停查看具体数值 | 点击柱形锁定年份",
			source: "来源：生态环境部历年全国环境空气质量状况、中国生态环境状况公报。",
			data: [
				{ year: 2015, value: 46 },
				{ year: 2016, value: 47 },
				{ year: 2017, value: 43 },
				{ year: 2018, value: 39 },
				{ year: 2019, value: 36 },
				{ year: 2020, value: 33 },
				{ year: 2021, value: 30 },
				{ year: 2022, value: 29 },
				{ year: 2023, value: 30 },
				{ year: 2024, value: 29.3 },
				{ year: 2025, value: 28.0 }
			]
		},
		water: {
			title: "全国地表水水质类别比例变化，2016—2025",
			subtitle: "一至三类为优良水质，四至五类为轻度污染，劣五类为重度污染",
			note: "绿色=优良水质 · 黄橙色=轻度污染 · 红色=重度污染",
			source: "来源：生态环境部历年全国地表水环境质量状况、中国生态环境状况公报。",
			data: [
				{ year: 2016, good: 67.8, bad: 8.6 },
				{ year: 2017, good: 67.9, bad: 8.3 },
				{ year: 2018, good: 71.0, bad: 6.7 },
				{ year: 2019, good: 74.9, bad: 3.4 },
				{ year: 2020, good: 83.4, bad: 0.6 },
				{ year: 2021, good: 84.9, bad: 1.2 },
				{ year: 2022, good: 87.9, bad: 0.7 },
				{ year: 2023, good: 89.4, bad: 0.7 },
				{ year: 2024, good: 90.4, bad: 0.6 },
				{ year: 2025, good: 91.4, bad: 0.6 }
			]
		}
	};

	function createSVGElement(tag, attrs = {}) {
		const el = document.createElementNS(svgNS, tag);
		for (const [key, value] of Object.entries(attrs)) {
			el.setAttribute(key, value);
		}
		return el;
	}

	function createHTMLElement(tag, className, textContent) {
		const el = document.createElement(tag);
		if (className) el.className = className;
		if (textContent) el.textContent = textContent;
		return el;
	}

	function scaleLinear(value, domainMin, domainMax, rangeMin, rangeMax) {
		return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
	}

	function formatNumber(value, digits = 1) {
		return Number.isInteger(value) ? String(value) : value.toFixed(digits);
	}

	function pointsToPath(points) {
		return points
			.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
			.join(" ");
	}

	function areaPath(points, bottom) {
		return `${pointsToPath(points)} L ${points[points.length - 1].x.toFixed(2)} ${bottom} L ${points[0].x.toFixed(2)} ${bottom} Z`;
	}

	function stackedAreaPath(topPoints, bottomPoints) {
		const topPath = pointsToPath(topPoints);
		const bottomPath = bottomPoints
			.slice()
			.reverse()
			.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
			.join(" ");
		return `${topPath} ${bottomPath} Z`;
	}

	function addText(svg, textValue, x, y, className, anchor = "middle") {
		const textEl = createSVGElement("text", {
			x,
			y,
			class: className,
			"text-anchor": anchor
		});
		textEl.textContent = textValue;
		svg.appendChild(textEl);
		return textEl;
	}

	function drawAxes(svg, options) {
		const { xTicks, yTicks, xScale, yScale, unit, yTickFormat = (v) => v } = options;

		for (const tick of yTicks) {
			const y = yScale(tick);
			svg.appendChild(createSVGElement("line", {
				x1: chartPlot.left,
				x2: chartPlot.right,
				y1: y,
				y2: y,
				class: "chart-grid-line"
			}));
			addText(svg, yTickFormat(tick), chartPlot.left - 12, y + 5, "chart-tick", "end");
		}

		svg.appendChild(createSVGElement("line", {
			x1: chartPlot.left,
			x2: chartPlot.left,
			y1: chartPlot.top,
			y2: chartPlot.bottom,
			class: "chart-axis"
		}));
		svg.appendChild(createSVGElement("line", {
			x1: chartPlot.left,
			x2: chartPlot.right,
			y1: chartPlot.bottom,
			y2: chartPlot.bottom,
			class: "chart-axis"
		}));

		for (const tick of xTicks) {
			const x = xScale(tick);
			svg.appendChild(createSVGElement("line", {
				x1: x,
				x2: x,
				y1: chartPlot.bottom,
				y2: chartPlot.bottom + 9,
				class: "chart-axis"
			}));
			addText(svg, tick, x, chartPlot.bottom + 32, "chart-tick");
		}

		if (unit) {
			addText(svg, unit, chartPlot.left - 10, chartPlot.top - 16, "chart-unit", "start");
		}
	}

	function buildChartShell(stage, config) {
		stage.replaceChildren();
		stage.dataset.activeSeries = "";

		const head = createHTMLElement("div", "chart-head");
		const copy = createHTMLElement("div", "chart-copy");
		copy.append(
			createHTMLElement("h2", "chart-title", config.title),
			createHTMLElement("p", "chart-subtitle", config.subtitle)
		);
		head.appendChild(copy);

		const body = createHTMLElement("div", "chart-body");
		const svg = createSVGElement("svg", {
			class: "chart-svg",
			viewBox: `0 0 ${chartSize.width} ${chartSize.height}`,
			role: "img",
			"aria-label": config.title,
			preserveAspectRatio: "xMidYMid meet"
		});
		const tooltip = createHTMLElement("div", "chart-tooltip");
		body.append(svg, tooltip);

		const legend = createHTMLElement("div", "chart-legend");
		const note = createHTMLElement("p", "chart-note", config.note);
		const source = createHTMLElement("span", "chart-source", config.source);
		note.appendChild(source);

		stage.append(head, body, legend, note);
		return { head, body, svg, tooltip, legend };
	}

	function setTooltip(stage, tooltip, x, y, title, rows) {
		tooltip.innerHTML = `<strong>${title}</strong>${rows.map((row) => `<span>${row}</span>`).join("")}`;
		tooltip.style.left = `${Math.max(14, Math.min(86, (x / chartSize.width) * 100))}%`;
		tooltip.style.top = `${Math.max(18, Math.min(88, (y / chartSize.height) * 100))}%`;
		tooltip.classList.add("is-visible");
		stage.dataset.tooltipActive = "true";
	}

	function hideTooltip(stage, tooltip) {
		if (stage.dataset.lockedHotspot === "true") return;
		tooltip.classList.remove("is-visible");
		stage.dataset.tooltipActive = "false";
	}

	function bindHotspot(stage, tooltip, hotspot, focusRing, x, y, title, rows) {
		function activate(lock = false) {
			stage.querySelectorAll(".chart-hotspot").forEach((item) => item.classList.remove("is-active"));
			hotspot.classList.add("is-active");
			if (lock) stage.dataset.lockedHotspot = "true";
			setTooltip(stage, tooltip, x, y, title, rows);
		}

		hotspot.setAttribute("tabindex", "0");
		hotspot.setAttribute("role", "button");
		hotspot.setAttribute("aria-label", `${title}，${rows.join("，")}`);
		hotspot.addEventListener("mouseenter", () => activate(false));
		hotspot.addEventListener("focus", () => activate(false));
		hotspot.addEventListener("mouseleave", () => hideTooltip(stage, tooltip));
		hotspot.addEventListener("blur", () => hideTooltip(stage, tooltip));
		hotspot.addEventListener("click", () => {
			const wasLocked = hotspot.classList.contains("is-active") && stage.dataset.lockedHotspot === "true";
			stage.dataset.lockedHotspot = wasLocked ? "false" : "true";
			if (wasLocked) {
				hotspot.classList.remove("is-active");
				tooltip.classList.remove("is-visible");
				return;
			}
			activate(true);
		});
		hotspot.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			hotspot.click();
		});
		hotspot.after(focusRing);
	}

	function createLegendButton(stage, legend, label, series, color) {
		const button = createHTMLElement("button", "chart-legend-button", label);
		button.type = "button";
		button.style.setProperty("--series-color", color);
		button.dataset.seriesButton = series;
		button.setAttribute("aria-pressed", "false");
		button.addEventListener("click", () => {
			const active = stage.dataset.activeSeries === series;
			stage.dataset.activeSeries = active ? "" : series;
			legend.querySelectorAll(".chart-legend-button").forEach((item) => {
				item.setAttribute("aria-pressed", item.dataset.seriesButton === stage.dataset.activeSeries ? "true" : "false");
			});
		});
		legend.appendChild(button);
	}

	function renderForestChart(stage) {
		const config = chartData.forest;
		const { svg, tooltip, legend } = buildChartShell(stage, config);
		const commonYears = config.series.forest.map((item) => item.year);
		const xScale = (value) => scaleLinear(value, commonYears[0], commonYears[commonYears.length - 1], chartPlot.left + 52, chartPlot.right - 32);
		const forestY = (value) => scaleLinear(value, 16, 26, chartPlot.bottom, chartPlot.top);
		const forestPoints = config.series.forest.map((item) => ({ ...item, x: xScale(item.year), y: forestY(item.value) }));

		drawAxes(svg, {
			xTicks: commonYears,
			yTicks: [16, 18, 20, 22, 24, 26],
			xScale,
			yScale: forestY,
			unit: "森林覆盖率（%）",
			yTickFormat: (value) => value
		});

		const forestArea = createSVGElement("path", {
			d: areaPath(forestPoints, chartPlot.bottom),
			class: "chart-area",
			"data-series": "forest"
		});
		forestArea.style.setProperty("--series-color", chartColors.green);
		svg.appendChild(forestArea);

		const forestLine = createSVGElement("path", {
			d: pointsToPath(forestPoints),
			class: "chart-line",
			"data-series": "forest"
		});
		forestLine.style.setProperty("--series-color", chartColors.greenLine);
		svg.appendChild(forestLine);

		for (const point of forestPoints) {
			const dot = createSVGElement("circle", {
				cx: point.x,
				cy: point.y,
				r: 4.8,
				class: "chart-dot",
				"data-series": "forest"
			});
			dot.style.setProperty("--series-color", chartColors.greenLine);
			svg.appendChild(dot);

			const hot = createSVGElement("circle", {
				cx: point.x,
				cy: point.y,
				r: 18,
				class: "chart-hotspot",
				"data-series": "forest"
			});
			const ring = createSVGElement("circle", {
				cx: point.x,
				cy: point.y,
				r: 20,
				class: "chart-focus-ring"
			});
			svg.appendChild(hot);
			bindHotspot(stage, tooltip, hot, ring, point.x, point.y, `${point.year}年`, [
				`森林覆盖率：${formatNumber(point.value, 2)}%`
			]);
		}

		createLegendButton(stage, legend, "森林覆盖率", "forest", chartColors.greenLine);
	}

	function renderPM25Chart(stage) {
		const config = chartData.pm25;
		const { svg, tooltip, legend } = buildChartShell(stage, config);
		const years = config.data.map((item) => item.year);
		const xScale = (value) => scaleLinear(value, years[0], years[years.length - 1], chartPlot.left + 48, chartPlot.right - 22);
		const yScale = (value) => scaleLinear(value, 0, 55, chartPlot.bottom, chartPlot.top);
		const points = config.data.map((item) => ({ ...item, x: xScale(item.year), y: yScale(item.value) }));
		const step = (chartPlot.right - chartPlot.left) / config.data.length;
		const barWidth = Math.min(56, step * 0.68);

		drawAxes(svg, {
			xTicks: [2015, 2018, 2021, 2024, 2025],
			yTicks: [0, 10, 20, 30, 40, 50],
			xScale,
			yScale,
			unit: "微克/立方米"
		});

		const standardY = yScale(35);
		svg.appendChild(createSVGElement("line", {
			x1: chartPlot.left,
			x2: chartPlot.right,
			y1: standardY,
			y2: standardY,
			stroke: "#bd674d",
			"stroke-width": "1.5"
		}));
		addText(svg, "国家二级年均标准 35", chartPlot.right - 18, standardY - 9, "chart-event-label", "end");

		for (const point of points) {
			const barX = point.x - barWidth / 2;
			const bar = createSVGElement("rect", {
				x: barX,
				y: point.y,
				width: barWidth,
				height: chartPlot.bottom - point.y,
				rx: 5,
				class: "chart-bar",
				"data-series": "pm25"
			});
			svg.appendChild(bar);
		}

		const line = createSVGElement("path", {
			d: pointsToPath(points),
			class: "chart-line",
			"data-series": "pm25"
		});
		line.style.setProperty("--series-color", chartColors.greenLine);
		svg.appendChild(line);

		for (const point of points) {
			svg.appendChild(createSVGElement("circle", {
				cx: point.x,
				cy: point.y,
				r: 4.5,
				class: "chart-dot",
				"data-series": "pm25"
			}));
			if ([2015, 2018, 2020, 2022, 2024, 2025].includes(point.year)) {
				addText(svg, formatNumber(point.value, 1), point.x, point.y - 12, "chart-label");
			}

			const hot = createSVGElement("rect", {
				x: point.x - barWidth / 2,
				y: chartPlot.top,
				width: barWidth,
				height: chartPlot.bottom - chartPlot.top,
				class: "chart-hotspot",
				"data-series": "pm25"
			});
			const ring = createSVGElement("rect", {
				x: point.x - barWidth / 2,
				y: point.y,
				width: barWidth,
				height: chartPlot.bottom - point.y,
				rx: 5,
				class: "chart-focus-ring"
			});
			svg.appendChild(hot);
			bindHotspot(stage, tooltip, hot, ring, point.x, point.y, `${point.year}年`, [
				`PM2.5年均浓度：${formatNumber(point.value, 1)}微克/立方米`
			]);
		}

		createLegendButton(stage, legend, "全国", "pm25", chartColors.greenLine);
		const first = points[0];
		const last = points[points.length - 1];
		addText(svg, `下降 ${formatNumber(first.value - last.value, 1)} 微克/立方米`, chartPlot.right - 120, chartPlot.top + 20, "chart-label");
	}

	function renderWaterChart(stage) {
		const config = chartData.water;
		const { svg, tooltip, legend } = buildChartShell(stage, config);
		const data = config.data.map((item) => {
			const middle = Math.max(0, 100 - item.good - item.bad);
			return { ...item, middle };
		});
		const years = data.map((item) => item.year);
		const xScale = (value) => scaleLinear(value, years[0], years[years.length - 1], chartPlot.left, chartPlot.right);
		const yScale = (value) => scaleLinear(value, 0, 100, chartPlot.bottom, chartPlot.top);

		drawAxes(svg, {
			xTicks: [2016, 2018, 2020, 2022, 2024, 2025],
			yTicks: [0, 20, 40, 60, 80, 100],
			xScale,
			yScale,
			unit: "%"
		});

		const goodTop = data.map((item) => ({ x: xScale(item.year), y: yScale(item.good) }));
		const bottom = data.map((item) => ({ x: xScale(item.year), y: yScale(0) }));
		const middleTop = data.map((item) => ({ x: xScale(item.year), y: yScale(item.good + item.middle) }));
		const badTop = data.map((item) => ({ x: xScale(item.year), y: yScale(100) }));

		const goodArea = createSVGElement("path", {
			d: stackedAreaPath(goodTop, bottom),
			class: "chart-area chart-stack",
			"data-series": "good"
		});
		goodArea.style.setProperty("--series-color", chartColors.green);
		svg.appendChild(goodArea);

		const middleArea = createSVGElement("path", {
			d: stackedAreaPath(middleTop, goodTop),
			class: "chart-area chart-stack",
			"data-series": "middle"
		});
		middleArea.style.setProperty("--series-color", chartColors.gold);
		svg.appendChild(middleArea);

		const badArea = createSVGElement("path", {
			d: stackedAreaPath(badTop, middleTop),
			class: "chart-area chart-stack",
			"data-series": "bad"
		});
		badArea.style.setProperty("--series-color", chartColors.red);
		svg.appendChild(badArea);

		const goodLine = createSVGElement("path", {
			d: pointsToPath(goodTop),
			class: "chart-line",
			"data-series": "good"
		});
		goodLine.style.setProperty("--series-color", chartColors.greenLine);
		svg.appendChild(goodLine);

		for (const item of data) {
			const x = xScale(item.year);
			const y = yScale(item.good);
			if ([2016, 2019, 2021, 2023, 2024, 2025].includes(item.year)) {
				addText(svg, formatNumber(item.good, 1), x, y - 12, "chart-label");
			}
			svg.appendChild(createSVGElement("circle", {
				cx: x,
				cy: y,
				r: 4.5,
				class: "chart-dot",
				"data-series": "good"
			}));

			const bandWidth = Math.max(44, (chartPlot.right - chartPlot.left) / (data.length + 2));
			const hot = createSVGElement("rect", {
				x: x - bandWidth / 2,
				y: chartPlot.top,
				width: bandWidth,
				height: chartPlot.bottom - chartPlot.top,
				class: "chart-hotspot"
			});
			const ring = createSVGElement("rect", {
				x: x - bandWidth / 2,
				y: chartPlot.top,
				width: bandWidth,
				height: chartPlot.bottom - chartPlot.top,
				class: "chart-focus-ring"
			});
			svg.appendChild(hot);
			bindHotspot(stage, tooltip, hot, ring, x, y, `${item.year}年`, [
				`一至三类：${formatNumber(item.good, 1)}%`,
				`四至五类：${formatNumber(item.middle, 1)}%`,
				`劣五类：${formatNumber(item.bad, 1)}%`
			]);
		}

		createLegendButton(stage, legend, "一至三类（优良）", "good", chartColors.green);
		createLegendButton(stage, legend, "四至五类（轻度污染）", "middle", chartColors.gold);
		createLegendButton(stage, legend, "劣五类（重度污染）", "bad", chartColors.red);
	}

	function renderChartStages() {
		document.querySelectorAll(".chart-stage").forEach((stage) => {
			if (stage.dataset.rendered === "true") return;
			stage.dataset.rendered = "true";

			if (stage.dataset.chart === "forest") {
				renderForestChart(stage);
			} else if (stage.dataset.chart === "pm25") {
				renderPM25Chart(stage);
			} else if (stage.dataset.chart === "water") {
				renderWaterChart(stage);
			}
		});
	}

	for (i = 0; i < sectionsLen; i++) {
		s = sections[i];
		w = s.querySelector(".comparator-wrapper");
		if (w) wrappers.push({ section: s, wrapper: w });
		c = s.querySelector(".comparator");
		if (!c) continue;
		p = c.querySelector(".comparison-percentage");
		if (p) {
			const layers = c.querySelectorAll(".image-layer");
			comparatorData.push({
				comp: c,
				pct: p,
				section: s,
				layerCount: layers.length,
				wrapper: w
			});
		}
	}

	const wrappersLen = wrappers.length;
	const compLen = comparatorData.length;
	let d, v;

	function createStageIndicators() {
		for (i = 0; i < compLen; i++) {
			d = comparatorData[i];
			const nav = document.createElement("div");
			nav.className = "stage-nav";

			const indicators = [];
			for (let j = 0; j < d.layerCount; j++) {
				const indicator = document.createElement("button");
				indicator.className = "stage-indicator";
				indicator.setAttribute("aria-label", `Go to stage ${j + 1}`);
				indicator.dataset.stage = j;
				indicator.dataset.comparatorIndex = i;
				indicators.push(indicator);
				nav.appendChild(indicator);
			}

			d.comp.appendChild(nav);
			d.indicators = indicators;
		}
	}

	function toPixels(value) {
		const numeric = parseFloat(value);
		if (!Number.isFinite(numeric)) return 0;
		return value.endsWith("vh") ? (numeric * window.innerHeight) / 100 : numeric;
	}

	function getComparatorDuration(data) {
		const style = getComputedStyle(data ? data.section : document.documentElement);
		const duration = style.getPropertyValue("--comparator-duration").trim();
		return toPixels(duration);
	}

	function syncStoryTimings() {
		for (i = 0; i < compLen; i++) {
			d = comparatorData[i];
			const panel = d.section.querySelector(".story-panel");
			const storyBlocks = panel
				? panel.querySelectorAll(".story-block")
				: [];
			const lastBlock = storyBlocks[storyBlocks.length - 1];
			if (!panel || !lastBlock) continue;

			const sectionTop = d.section.getBoundingClientRect().top + window.scrollY;
			const lastBlockTop =
				lastBlock.getBoundingClientRect().top + window.scrollY;
			const completionPoint =
				lastBlockTop - sectionTop - window.innerHeight * storyCompleteAnchor;
			const minimumDuration = window.innerHeight * 2.4;
			const duration = Math.max(completionPoint, minimumDuration);
			const storyHeight = panel.scrollHeight + window.innerHeight * 0.3;

			d.section.style.setProperty("--comparator-duration", duration + "px");
			d.section.style.setProperty("--story-scroll-height", storyHeight + "px");
		}
	}

	let targetScrollPosition = null;
	const scrollEase = 0.08;

	function scrollToStage(comparatorIndex, stageIndex) {
		const data = comparatorData[comparatorIndex];
		if (!data) return;

		const offset = data.section.offsetTop;
		const duration = getComparatorDuration(data);
		const stageCount = data.layerCount;

		stageIndex = Math.max(0, Math.min(stageIndex, stageCount - 1));

		const stageDuration = duration / (stageCount - 1);
		targetScrollPosition = offset + stageDuration * stageIndex;
	}

	function onIndicatorClick(e) {
		const btn = e.target.closest(".stage-indicator");
		if (!btn) return;

		const stage = parseInt(btn.dataset.stage, 10);
		const compIndex = parseInt(btn.dataset.comparatorIndex, 10);

		scrollToStage(compIndex, stage);
	}

	function updateOffsets() {
		for (i = 0; i < wrappersLen; i++) {
			w = wrappers[i];
			w.wrapper.style.setProperty(
				"--comparator-offset",
				w.section.offsetTop + "px"
			);
		}
	}

	function onWheel(e) {
		e.preventDefault();
		targetScrollPosition = null;
		velocity += e.deltaY;
	}

	let resizeTimeout;

	function onResize() {
		targetScrollPosition = null;

		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			syncStoryTimings();
			updateOffsets();
		}, 150);
	}

	function onMouseDown(e) {
		if (!e.target.closest(".comparator-wrapper")) {
			targetScrollPosition = null;
		}
	}

	function frame() {
		if (targetScrollPosition !== null) {
			const current = window.scrollY;
			const delta = targetScrollPosition - current;

			if (Math.abs(delta) > 1) {
				window.scrollBy(0, delta * scrollEase);
			} else {
				targetScrollPosition = null;
			}
		}

		velocity *= friction;
		if (velocity > 0.2 || velocity < -0.2) {
			window.scrollBy(0, velocity * ease);
		}

		for (i = 0; i < compLen; i++) {
			d = comparatorData[i];
			v =
				parseFloat(
					getComputedStyle(d.comp).getPropertyValue("--scroll-progress")
				) || 0;
			d.pct.textContent = (Math.round(v) + "").padStart(2, "0") + "%";

			const currentStage = Math.round((v / 100) * (d.layerCount - 1));
			d.indicators.forEach((indicator, idx) => {
				indicator.classList.toggle("active", idx === currentStage);
			});
		}
		requestAnimationFrame(frame);
	}

	window.addEventListener("wheel", onWheel, { passive: false });
	window.addEventListener("resize", onResize, { passive: true });
	window.addEventListener("mousedown", onMouseDown, { passive: true });
	document.addEventListener("click", onIndicatorClick);

	hydrateStoryPanels();
	renderChartStages();

	window.addEventListener("load", () => {
		createStageIndicators();
		syncStoryTimings();
		updateOffsets();
		if (document.fonts) {
			document.fonts.ready.then(() => {
				syncStoryTimings();
				updateOffsets();
			});
		}
	requestAnimationFrame(frame);
  });

  window.__catalogScrollTo = function(chapterId) {
    if (chapterId === 'chapter-2') { scrollToStage(0, 0); return true; }
    if (chapterId === 'chapter-3') { scrollToStage(1, 0); return true; }
    if (chapterId === 'chapter-4') { scrollToStage(2, 0); return true; }
    return false;
  };
})();

(function () {
	"use strict";

	const returnMask = document.getElementById("returnTransitionMask");
	const returnLink = document.getElementById("home-return-link");

	if (!returnMask || !returnLink) return;

	const topTriggerDelta = 160;
	const topEpsilon = 4;
	const transitionDelay = window.matchMedia("(prefers-reduced-motion: reduce)")
		.matches
		? 180
		: 920;
	let topScrollIntent = 0;
	let started = false;
	let lastTouchY = null;

	function getViewportHeight() {
		return window.visualViewport?.height || window.innerHeight || 1;
	}

	function isAtTop() {
		return window.scrollY <= topEpsilon;
	}

	function resetTopIntent() {
		topScrollIntent = 0;
	}

	function normalizeWheelDelta(event) {
		const linePx = 16;
		const pagePx = getViewportHeight() * 0.9;

		if (event.deltaMode === 1) return event.deltaY * linePx;
		if (event.deltaMode === 2) return event.deltaY * pagePx;
		return event.deltaY;
	}

	function startReturnTransition() {
		if (started) return;

		started = true;
		resetTopIntent();
		returnMask.classList.add("is-active");

		window.setTimeout(() => {
			returnLink.click();
		}, transitionDelay);
	}

	function registerTopScrollIntent(deltaY, event) {
		if (started) return;

		if (deltaY >= 0 || !isAtTop()) {
			resetTopIntent();
			return;
		}

		event?.preventDefault?.();
		topScrollIntent += Math.min(Math.abs(deltaY), 120);

		if (topScrollIntent >= topTriggerDelta) {
			startReturnTransition();
		}
	}

	window.addEventListener(
		"wheel",
		(event) => {
			registerTopScrollIntent(normalizeWheelDelta(event), event);
		},
		{ passive: false }
	);

	window.addEventListener(
		"touchstart",
		(event) => {
			lastTouchY = event.touches?.[0]?.clientY ?? null;
		},
		{ passive: true }
	);

	window.addEventListener(
		"touchmove",
		(event) => {
			const currentY = event.touches?.[0]?.clientY ?? null;

			if (currentY === null || lastTouchY === null) {
				lastTouchY = currentY;
				return;
			}

			const deltaY = lastTouchY - currentY;
			lastTouchY = currentY;
			registerTopScrollIntent(deltaY, event);
		},
		{ passive: false }
	);

	window.addEventListener(
		"scroll",
		() => {
			if (!isAtTop()) resetTopIntent();
		},
		{ passive: true }
	);

	window.addEventListener("resize", resetTopIntent);
})();

(function () {
	"use strict";

	const nextLink = document.getElementById("next-page-link");
	const transitionMask = document.getElementById("returnTransitionMask");

	if (!nextLink || !transitionMask) return;

	const nextPagePath = "../shouye/dist/wu.html";
	const bottomTriggerDelta = 140;
	const bottomEpsilon = 4;
	const transitionDelay = window.matchMedia("(prefers-reduced-motion: reduce)")
		.matches
		? 180
		: 920;
	let bottomScrollIntent = 0;
	let started = false;
	let lastTouchY = null;

	function getViewportHeight() {
		return window.visualViewport?.height || window.innerHeight || 1;
	}

	function getScrollTop() {
		return window.scrollY || document.documentElement.scrollTop || 0;
	}

	function getDocumentHeight() {
		const doc = document.documentElement;
		const body = document.body;

		return Math.max(
			doc.scrollHeight,
			doc.offsetHeight,
			body ? body.scrollHeight : 0,
			body ? body.offsetHeight : 0
		);
	}

	function isAtBottom() {
		return getScrollTop() + getViewportHeight() >= getDocumentHeight() - bottomEpsilon;
	}

	function resetBottomIntent() {
		bottomScrollIntent = 0;
	}

	function normalizeWheelDelta(event) {
		const linePx = 16;
		const pagePx = getViewportHeight() * 0.9;

		if (event.deltaMode === 1) return event.deltaY * linePx;
		if (event.deltaMode === 2) return event.deltaY * pagePx;
		return event.deltaY;
	}

	function hashParams() {
		return new URLSearchParams(window.location.hash.replace(/^#/, ""));
	}

	function buildNextHref() {
		const params = new URLSearchParams();
		const returnY = Math.max(0, Math.round(getScrollTop()));

		params.set("returnY", String(returnY));
		params.set("transition", "split");

		try {
			window.sessionStorage.setItem("liangshanIndexReturnY", String(returnY));
		} catch (error) {}

		return nextPagePath + "#" + params.toString();
	}

	function revealIncomingTransition() {
		if (hashParams().get("transition") !== "split") return;

		transitionMask.classList.add("is-active");
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				transitionMask.classList.add("is-revealing");
			});
		});

		window.setTimeout(() => {
			transitionMask.classList.remove("is-active", "is-revealing");
		}, transitionDelay);
	}

	function restoreScrollFromHash() {
		const value = Number.parseInt(hashParams().get("scrollY"), 10);
		if (!Number.isFinite(value)) return;

		function restore() {
			window.scrollTo(0, Math.max(0, value));
			resetBottomIntent();
			updateLinkVisibility();
		}

		if (document.readyState === "complete") {
			requestAnimationFrame(restore);
		} else {
			window.addEventListener(
				"load",
				() => {
					requestAnimationFrame(restore);
				},
				{ once: true }
			);
		}
	}

	function updateLinkVisibility() {
		nextLink.classList.toggle("is-visible", isAtBottom() && !started);
	}

	function startNextTransition() {
		if (started) return;

		started = true;
		resetBottomIntent();
		nextLink.href = buildNextHref();
		nextLink.classList.remove("is-visible");
		transitionMask.classList.remove("is-revealing");
		transitionMask.classList.add("is-active");

		window.setTimeout(() => {
			nextLink.click();
		}, transitionDelay);
	}

	function registerBottomScrollIntent(deltaY, event) {
		if (started) return;

		if (deltaY <= 0 || !isAtBottom()) {
			resetBottomIntent();
			updateLinkVisibility();
			return;
		}

		event?.preventDefault?.();
		bottomScrollIntent += Math.min(Math.abs(deltaY), 120);

		if (bottomScrollIntent >= bottomTriggerDelta) {
			startNextTransition();
		}
	}

	nextLink.addEventListener("click", (event) => {
		if (started) return;

		event.preventDefault();
		startNextTransition();
	});

	window.addEventListener(
		"wheel",
		(event) => {
			registerBottomScrollIntent(normalizeWheelDelta(event), event);
		},
		{ passive: false }
	);

	window.addEventListener(
		"touchstart",
		(event) => {
			lastTouchY = event.touches?.[0]?.clientY ?? null;
		},
		{ passive: true }
	);

	window.addEventListener(
		"touchmove",
		(event) => {
			const currentY = event.touches?.[0]?.clientY ?? null;

			if (currentY === null || lastTouchY === null) {
				lastTouchY = currentY;
				return;
			}

			const deltaY = lastTouchY - currentY;
			lastTouchY = currentY;
			registerBottomScrollIntent(deltaY, event);
		},
		{ passive: false }
	);

	window.addEventListener(
		"scroll",
		() => {
			if (!isAtBottom()) resetBottomIntent();
			updateLinkVisibility();
		},
		{ passive: true }
	);

	window.addEventListener("resize", () => {
		resetBottomIntent();
		updateLinkVisibility();
	});

	restoreScrollFromHash();
	revealIncomingTransition();
	updateLinkVisibility();
})();

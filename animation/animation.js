import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

(async function runApp() {
  // Configuration and State Variables
  const config = {
    width: 900,
    height: 700,
    margin: { top: 20, right: 40, bottom: 150, left: 80 },
    duration: 750,
    dataPath: "../datasets/gapminder_full.csv",
    excludeCountry: "Kuwait",
    svgSelector: "#visContainer",
    playButtonSelector: "#play",
    pauseButtonSelector: "#pause",
    resetButtonSelector: "#reset",
    yearSliderSelector: "#yearSlider",
    yearDisplaySelector: "#yearDisplay",
    scaleSelectSelector: "#scaleSelect",
    legendSpacingX: 150,
    legendSpacingY: 25,
    legendSize: 15,
  };

  let svg, xAxisGroup, yAxisGroup, yearLabel;
  let xScale, yScale, radiusScale, colorScale;
  let dataset, years, continents;
  let tooltip;
  let isPlaying = false;
  let currentYearIndex = 0;
  let timer;
  let xScaleType = "log"; // Set logarithmic scale as default

  // Prepare Visualization
  async function prepareVis() {
    // Load and preprocess data
    dataset = await d3.csv(config.dataPath, d3.autoType);
    dataset = dataset.filter((d) => d.country !== config.excludeCountry);

    // Extract unique years and continents
    years = Array.from(new Set(dataset.map((d) => d.year))).sort(
      (a, b) => a - b
    );
    continents = Array.from(new Set(dataset.map((d) => d.continent))).sort();

    // Define SVG dimensions
    const { width, height, margin } = config;

    svg = d3
      .select(config.svgSelector)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("svg-content-responsive", true);

    // Compute the padding for scales
    const xExtent = d3.extent(dataset, (d) => d.gdp_cap);
    const yExtent = d3.extent(dataset, (d) => d.life_exp);

    const xDomainLinear = [0, xExtent[1] * 1.05]; // Add 5% padding
    const xDomainLog = [xExtent[0] / 1.05, xExtent[1] * 1.05]; // Add padding
    const yDomain = [yExtent[0] - 5, yExtent[1] + 5]; // Add 5 units padding

    // Initialize scales
    xScale =
      xScaleType === "linear"
        ? d3.scaleLinear().range([margin.left, width - margin.right])
        : d3.scaleLog().range([margin.left, width - margin.right]);

    yScale = d3
      .scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain(yDomain);

    radiusScale = d3
      .scaleSqrt()
      .range([4, 40])
      .domain(d3.extent(dataset, (d) => d.population));

    colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(continents);

    // Initialize axes
    xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`);

    yAxisGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Axis Labels
    svg
      .append("text")
      .attr("class", "xLabel")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 40)
      .attr("text-anchor", "middle")
      .text("GDP per Capita");

    svg
      .append("text")
      .attr("class", "yLabel")
      .attr("x", -height / 2)
      .attr("y", margin.left - 60)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Life Expectancy");

    // Year Label
    yearLabel = svg
      .append("text")
      .attr("class", "yearLabel")
      .attr("x", width - margin.right)
      .attr("y", height - margin.bottom + 110)
      .attr("text-anchor", "end")
      .attr("fill", "#ccc")
      .attr("opacity", 0.7)
      .text(years[0]);

    // Legend
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${margin.left}, ${height - margin.bottom + 70})`
      );

    // Arrange legend items in multiple rows if necessary
    continents.forEach((continent, i) => {
      const legendRow = legend
        .append("g")
        .attr(
          "transform",
          `translate(${(i % 5) * config.legendSpacingX}, ${
            Math.floor(i / 5) * config.legendSpacingY
          })`
        );

      legendRow
        .append("rect")
        .attr("width", config.legendSize)
        .attr("height", config.legendSize)
        .attr("fill", colorScale(continent));

      legendRow
        .append("text")
        .attr("x", config.legendSize + 5)
        .attr("y", config.legendSize / 2)
        .attr("dy", "0.35em")
        .text(continent)
        .attr("fill", "#333");
    });

    // Initialize Tooltip
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("visibility", "hidden");

    // Store domains
    config.xDomainLinear = xDomainLinear;
    config.xDomainLog = xDomainLog;
    config.yDomain = yDomain;
  }

  // Draw or Update Visualization for a Given Year
  function drawVis(year) {
    const yearData = dataset.filter((d) => d.year === year);

    // Update Year Label
    yearLabel.text(year);

    // Update scales
    xScale.domain(
      xScaleType === "linear" ? config.xDomainLinear : config.xDomainLog
    );

    // Update Axes
    xAxisGroup
      .transition()
      .duration(config.duration)
      .call(
        xScaleType === "linear"
          ? d3.axisBottom(xScale)
          : d3.axisBottom(xScale).ticks(10, ".0s")
      );

    // Bind Data
    const circles = svg.selectAll("circle").data(yearData, (d) => d.country);

    // Enter Selection
    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.gdp_cap))
      .attr("cy", (d) => yScale(d.life_exp))
      .attr("r", 0)
      .attr("fill", (d) => colorScale(d.continent))
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(
            `<strong>${d.country}</strong><br/>
            Continent: ${d.continent}<br/>
            GDP per Capita: $${d3.format(",.0f")(d.gdp_cap)}<br/>
            Life Expectancy: ${d3.format(".1f")(d.life_exp)} years<br/>
            Population: ${d3.format(",.0f")(d.population)}`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      })
      .transition()
      .duration(config.duration)
      .attr("r", (d) => radiusScale(d.population));

    // Update Selection
    circles
      .transition()
      .duration(config.duration)
      .attr("cx", (d) => xScale(d.gdp_cap))
      .attr("cy", (d) => yScale(d.life_exp))
      .attr("r", (d) => radiusScale(d.population))
      .attr("fill", (d) => colorScale(d.continent));

    // Exit Selection
    circles
      .exit()
      .transition()
      .duration(config.duration)
      .attr("r", 0)
      .remove();
  }

  function playAnimation() {
    if (isPlaying) return;
    isPlaying = true;
    document.querySelector(config.playButtonSelector).disabled = true;
    document.querySelector(config.pauseButtonSelector).disabled = false;
    document.querySelector(config.resetButtonSelector).disabled = false;
    timer = setInterval(() => {
      if (currentYearIndex >= years.length - 1) {
        pauseAnimation();
        return;
      }
      currentYearIndex++;
      const year = years[currentYearIndex];
      updateYear(year);
    }, config.duration);
  }

  function pauseAnimation() {
    isPlaying = false;
    document.querySelector(config.playButtonSelector).disabled = false;
    document.querySelector(config.pauseButtonSelector).disabled = true;
    clearInterval(timer);
  }

  function resetAnimation() {
    pauseAnimation();
    currentYearIndex = 0;
    updateYear(years[currentYearIndex]);
    document.querySelector(config.resetButtonSelector).disabled = true;
  }

  function updateYear(year) {
    const slider = document.querySelector(config.yearSliderSelector);
    const yearDisplay = document.querySelector(config.yearDisplaySelector);
    slider.value = year;
    yearDisplay.textContent = year;
    currentYearIndex = years.indexOf(year);
    drawVis(year);
  }

  // Initialize the Visualization
  await prepareVis();

  // Initialize the slider
  const yearSlider = document.querySelector(config.yearSliderSelector);
  yearSlider.min = years[0];
  yearSlider.max = years[years.length - 1];
  yearSlider.step = 5; // Assuming the years are every 5 years
  yearSlider.value = years[0];

  document.querySelector(config.yearDisplaySelector).textContent = years[0];

  // Set the scale select to default to "log"
  const scaleSelect = document.querySelector(config.scaleSelectSelector);
  scaleSelect.value = "log";

  // Initial Draw
  drawVis(years[0]);

  // Event Listeners
  document
    .querySelector(config.playButtonSelector)
    .addEventListener("click", playAnimation);
  document
    .querySelector(config.pauseButtonSelector)
    .addEventListener("click", pauseAnimation);
  document
    .querySelector(config.resetButtonSelector)
    .addEventListener("click", resetAnimation);

  document
    .querySelector(config.yearSliderSelector)
    .addEventListener("input", function () {
      const year = +this.value;
      updateYear(year);
    });

  document
    .querySelector(config.scaleSelectSelector)
    .addEventListener("change", function () {
      xScaleType = this.value;
      xScale =
        xScaleType === "linear"
          ? d3
              .scaleLinear()
              .range([config.margin.left, config.width - config.margin.right])
          : d3
              .scaleLog()
              .range([config.margin.left, config.width - config.margin.right]);
      updateYear(years[currentYearIndex]);
    });

  // Initially disable pause and reset buttons
  document.querySelector(config.pauseButtonSelector).disabled = true;
  document.querySelector(config.resetButtonSelector).disabled = true;
})();

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import _ from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm";

// Application Configuration
const config = {
  width: 900,
  height: 700,
  margin: {
    top: 80, // Increased top margin for labels
    right: 40,
    bottom: 80, // Increased bottom margin for labels
    left: 100, // Increased left margin for labels
  },
  duration: 750, // Animation duration in milliseconds
  dataPath: "../datasets/gapminder_full.csv", // Ensure this path is correct
  excludeCountry: "Kuwait",
  svgSelector: "#visualizations",
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

// Tooltip Div
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

// Main Application Class
class App {
  constructor(config) {
    this.config = config;
    this.dataset = null;
    this.years = [];
    this.continents = [];
    this.currentYearIndex = 0;
    this.isPlaying = false;
    this.timer = null;
    this.xScaleType = "log"; // Default scale
    this.selectedContinents = new Set(); // To handle multiple selections

    // Bind UI Elements
    this.playButton = d3.select(this.config.playButtonSelector);
    this.pauseButton = d3.select(this.config.pauseButtonSelector);
    this.resetButton = d3.select(this.config.resetButtonSelector);
    this.yearSlider = d3.select(this.config.yearSliderSelector);
    this.yearDisplay = d3.select(this.config.yearDisplaySelector);
    this.scaleSelect = d3.select(this.config.scaleSelectSelector);
  }

  async init() {
    await this.loadData();
    this.initVisualizations(); // Initialize visualizations first
    this.initControls(); // Then initialize controls
    this.updateVisualizations();
  }

  async loadData() {
    try {
      this.dataset = await d3.csv(this.config.dataPath, d3.autoType);
      if (!this.dataset || this.dataset.length === 0) {
        throw new Error("Dataset is empty or not loaded properly.");
      }
      this.dataset = this.dataset.filter(d => d.country !== this.config.excludeCountry);
      this.years = Array.from(new Set(this.dataset.map(d => d.year))).sort((a, b) => a - b);
      this.continents = Array.from(new Set(this.dataset.map(d => d.continent))).sort();
      console.log("Data loaded successfully:", this.dataset);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error loading data. Please check the console for more details.");
    }
  }

  initControls() {
    // Initialize Year Slider
    this.yearSlider
      .attr("min", this.years[0])
      .attr("max", this.years[this.years.length - 1])
      .attr("step", 5)
      .property("value", this.years[0]);

    this.yearDisplay.text(this.years[0]);

    // Event Listeners
    this.playButton.on("click", () => this.playAnimation());
    this.pauseButton.on("click", () => this.pauseAnimation());
    this.resetButton.on("click", () => this.resetAnimation());

    this.yearSlider.on("input", () => {
      const year = +this.yearSlider.property("value");
      this.currentYearIndex = this.years.indexOf(year);
      this.updateVisualizations();
    });

    this.scaleSelect.on("change", () => {
      this.xScaleType = this.scaleSelect.property("value");
      this.updateVisualizations();
    });

    // Initially disable pause and reset buttons
    this.pauseButton.attr("disabled", true);
    this.resetButton.attr("disabled", true);
  }

  initVisualizations() {
    // Calculate maximum average population across all years for the bar chart y-axis
    const groupedDataAllYears = _(this.dataset)
      .groupBy(d => `${d.year}-${d.continent}`)
      .map((objs, key) => ({
        yearContinent: key,
        averagePopulation: _.meanBy(objs, "population"),
      }))
      .value();

    const maxAvgPopulation = d3.max(groupedDataAllYears, d => d.averagePopulation);

    this.scatterPlot = new ScatterPlot({
      container: "#scatterplotContainer",
      width: 500,
      height: 500,
      margin: this.config.margin,
      xScaleType: this.xScaleType,
      tooltip: tooltip,
      colorScale: d3.scaleOrdinal(d3.schemeTableau10).domain(this.continents),
      duration: this.config.duration,
    }, this.dataset, this.years, this.continents);

    this.barChart = new BarChart({
      container: "#barchartContainer",
      width: 500,
      height: 600,
      margin: this.config.margin,
      tooltip: tooltip,
      colorScale: d3.scaleOrdinal(d3.schemeTableau10).domain(this.continents),
      duration: this.config.duration,
      maxAvgPopulation: maxAvgPopulation, // Pass the maximum average population
    }, this.dataset, this.years, this.continents);

    // Link the charts for interaction
    this.barChart.onSelectContinent = (continent) => {
      console.log(`Bar clicked: ${continent}`);
      if (this.selectedContinents.has(continent)) {
        this.selectedContinents.delete(continent);
        console.log(`Deselected continent: ${continent}`);
      } else {
        this.selectedContinents.add(continent);
        console.log(`Selected continent: ${continent}`);
      }
      this.scatterPlot.setSelectedContinents(Array.from(this.selectedContinents));
      this.barChart.updateSelection(Array.from(this.selectedContinents));
      this.updateVisualizations();
    };
  }

  updateVisualizations() {
    if (!this.scatterPlot || !this.barChart) {
      return; // Ensure that visualizations are initialized
    }
    const currentYear = this.years[this.currentYearIndex];
    this.yearSlider.property("value", currentYear);
    this.yearDisplay.text(currentYear);
    this.barChart.update(currentYear, this.xScaleType, Array.from(this.selectedContinents));
    this.scatterPlot.update(currentYear, this.xScaleType, Array.from(this.selectedContinents));
  }

  playAnimation() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playButton.attr("disabled", true);
    this.pauseButton.attr("disabled", null);
    this.resetButton.attr("disabled", null);

    this.timer = setInterval(() => {
      if (this.currentYearIndex >= this.years.length - 1) {
        this.pauseAnimation();
        return;
      }
      this.currentYearIndex++;
      this.updateVisualizations();
    }, this.config.duration);
  }

  pauseAnimation() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.playButton.attr("disabled", null);
    this.pauseButton.attr("disabled", true);
    clearInterval(this.timer);
  }

  resetAnimation() {
    this.pauseAnimation();
    this.currentYearIndex = 0;
    this.selectedContinents.clear();
    this.scatterPlot.setSelectedContinents([]);
    this.barChart.updateSelection([]);
    this.updateVisualizations();
    this.resetButton.attr("disabled", true);
  }
}

// ScatterPlot Class
class ScatterPlot {
  constructor(options, dataset, years, continents) {
    this.container = options.container;
    this.width = options.width;
    this.height = options.height;
    this.margin = options.margin;
    this.tooltip = options.tooltip;
    this.colorScale = options.colorScale;
    this.dataset = dataset;
    this.years = years;
    this.continents = continents;
    this.selectedContinents = [];
    this.duration = options.duration || 750; // Default to 750ms if not provided

    this.initChart();
  }

  initChart() {
    this.svg = d3.select(this.container)
      .append("svg")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Axis Groups
    this.xAxisGroup = this.svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.height - this.margin.bottom})`);

    this.yAxisGroup = this.svg.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${this.margin.left}, 0)`);

    // Axis Labels
    this.svg.append("text")
      .attr("class", "xLabel")
      .attr("x", this.width / 2)
      .attr("y", this.height - this.margin.bottom + 60)
      .attr("text-anchor", "middle")
      .text("GDP per Capita");

    this.svg.append("text")
      .attr("class", "yLabel")
      .attr("x", -this.height / 2)
      .attr("y", this.margin.left - 80)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Life Expectancy");

    // Year Label
    this.yearLabel = this.svg.append("text")
      .attr("class", "yearLabel")
      .attr("x", this.width - this.margin.right)
      .attr("y", this.margin.top)
      .attr("text-anchor", "end")
      .attr("fill", "#ccc")
      .attr("opacity", 0.7)
      .text(this.years[0]);

    // Initialize Scales
    this.xScale = d3.scaleLog().range([this.margin.left, this.width - this.margin.right]);
    this.yScale = d3.scaleLinear()
      .domain([0, this.maxAvgPopulation * 1.1]) 
      .range([this.height - this.margin.bottom, this.margin.top]);

    // Initialize Radius Scale
    this.radiusScale = d3.scaleSqrt()
      .range([4, 40])
      .domain(d3.extent(this.dataset, d => d.population));

    // Initialize Color Scale
    this.color = this.colorScale;

    // Initialize Tooltip Interaction
    this.svg.append("g")
      .attr("class", "circles-group");
  }

  update(year, xScaleType, selectedContinents) {
    const data = this.dataset.filter(d => d.year === year);
    this.yearLabel.text(year);

    this.selectedContinents = selectedContinents;

    // Update scales based on all data for the current year
    if (xScaleType === "linear") {
      this.xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.gdp_cap) * 1.05])
        .range([this.margin.left, this.width - this.margin.right]);
    } else {
      // Ensure that gdp_cap values are positive and greater than zero for log scale
      const minGDP = d3.min(data, d => d.gdp_cap);
      this.xScale = d3.scaleLog()
        .domain([minGDP > 0 ? minGDP / 1.05 : 1, d3.max(data, d => d.gdp_cap) * 1.05])
        .range([this.margin.left, this.width - this.margin.right]);
    }

    this.yScale.domain([d3.min(data, d => d.life_exp) - 5, d3.max(data, d => d.life_exp) + 5]);

    // Update Axes
    this.xAxisGroup.transition().duration(this.duration)
      .call(
        xScaleType === "linear" ?
        d3.axisBottom(this.xScale) :
        d3.axisBottom(this.xScale).ticks(10, ".0s")
      );

    this.yAxisGroup.transition().duration(this.duration)
      .call(d3.axisLeft(this.yScale));

    // Bind Data
    const circles = this.svg.select(".circles-group")
      .selectAll("circle")
      .data(data, d => d.country);

    // Enter
    circles.enter()
      .append("circle")
      .attr("cx", d => this.xScale(d.gdp_cap))
      .attr("cy", d => this.yScale(d.life_exp))
      .attr("r", 0)
      .attr("fill", d => this.color(d.continent))
      .attr("stroke", "none")
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        this.tooltip
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
        this.tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        this.tooltip.style("visibility", "hidden");
      })
      .transition()
      .duration(this.duration)
      .attr("r", d => this.radiusScale(d.population));

    // Update
    circles.transition()
      .duration(this.duration)
      .attr("cx", d => this.xScale(d.gdp_cap))
      .attr("cy", d => this.yScale(d.life_exp))
      .attr("r", d => this.radiusScale(d.population))
      .attr("fill", d => this.color(d.continent))
      .attr("stroke", d => this.selectedContinents.includes(d.continent) ? "black" : "none")
      .attr("stroke-width", d => this.selectedContinents.includes(d.continent) ? 2 : 0)
      .attr("opacity", d => {
        if (this.selectedContinents.length > 0 && !this.selectedContinents.includes(d.continent)) {
          return 0.1; // Dim non-selected continents
        }
        return 0.9; // Highlight selected continents more boldly
      });

    // Exit
    circles.exit()
      .transition()
      .duration(this.duration)
      .attr("r", 0)
      .remove();
  }

  setSelectedContinents(continents) {
    this.selectedContinents = continents;
  }
}

// BarChart Class
class BarChart {
  constructor(options, dataset, years, continents) {
    this.container = options.container;
    this.width = options.width;
    this.height = options.height;
    this.margin = options.margin;
    this.tooltip = options.tooltip;
    this.colorScale = options.colorScale;
    this.dataset = dataset;
    this.years = years;
    this.continents = continents;
    this.selectedContinents = new Set();
    this.onSelectContinent = null; // Callback for selection
    this.duration = options.duration || 750; // Animation duration
    this.maxAvgPopulation = options.maxAvgPopulation; // Maximum average population across all years

    this.initChart();
  }

  initChart() {
    this.svg = d3.select(this.container)
      .append("svg")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Axis Groups
    this.xAxisGroup = this.svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.height - this.margin.bottom})`);

    this.yAxisGroup = this.svg.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${this.margin.left}, 0)`);

    // Axis Labels
    this.svg.append("text")
      .attr("class", "xLabel")
      .attr("x", this.width / 2)
      .attr("y", this.height - this.margin.bottom + 60)
      .attr("text-anchor", "middle")
      .text("Continent");

    this.svg.append("text")
      .attr("class", "yLabel")
      .attr("x", -this.height / 2)
      .attr("y", this.margin.left - 80)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Average Population");

    // Title
    this.title = this.svg.append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2)
      .attr("y", this.margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "1.5em")
      .text("Average Population by Continent");

    // Initialize Scales
    this.xScale = d3.scaleBand()
      .domain(this.continents)
      .range([this.margin.left, this.width - this.margin.right])
      .padding(0.1);

    this.yScale = d3.scaleLinear()
      .domain([0, this.maxAvgPopulation * 1.1]) // Use maximum average population across all years
      .range([this.height - this.margin.bottom, this.margin.top]);

    // Initialize Tooltip Interaction
    this.svg.append("g")
      .attr("class", "bars-group");
  }

  update(year, xScaleType, selectedContinents) {
    const data = this.dataset.filter(d => d.year === year);
    // Group by continent and calculate average population
    const groupedData = _(data)
      .groupBy("continent")
      .map((objs, key) => ({
        continent: key,
        averagePopulation: _.meanBy(objs, "population"),
      }))
      .value();

    // Update Axes with smooth transition
    this.xAxisGroup.transition().duration(this.duration)
      .call(d3.axisBottom(this.xScale));

    this.yAxisGroup.transition().duration(this.duration)
      .call(d3.axisLeft(this.yScale).tickFormat(d3.format(".2s")));

    // Bind Data
    const bars = this.svg.select(".bars-group")
      .selectAll("rect")
      .data(groupedData, d => d.continent);

    // Enter
    bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => this.xScale(d.continent))
      .attr("y", this.yScale(0)) // Start from yScale(0)
      .attr("width", this.xScale.bandwidth())
      .attr("height", 0)
      .attr("fill", d => this.colorScale(d.continent))
      .attr("stroke", d => this.selectedContinents.has(d.continent) ? "black" : "none")
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => {
        this.tooltip
          .style("visibility", "visible")
          .html(
            `<strong>${d.continent}</strong><br/>
                Average Population: ${d3.format(",.0f")(d.averagePopulation)}`
          );
      })
      .on("mousemove", (event) => {
        this.tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        this.tooltip.style("visibility", "hidden");
      })
      .on("click", (event, d) => {
        console.log(`Bar clicked: ${d.continent}`);
        if (this.onSelectContinent) {
          this.onSelectContinent(d.continent);
        }
      })
      .transition()
      .duration(this.duration)
      .attr("y", d => this.yScale(d.averagePopulation))
      .attr("height", d => this.height - this.margin.bottom - this.yScale(d.averagePopulation));

    // Update
    bars.transition()
      .duration(this.duration)
      .attr("x", d => this.xScale(d.continent))
      .attr("y", d => this.yScale(d.averagePopulation))
      .attr("width", this.xScale.bandwidth())
      .attr("height", d => this.height - this.margin.bottom - this.yScale(d.averagePopulation))
      .attr("fill", d => this.colorScale(d.continent))
      .attr("stroke", d => this.selectedContinents.has(d.continent) ? "black" : "none")
      .attr("stroke-width", d => this.selectedContinents.has(d.continent) ? 3 : 0);

    // Exit
    bars.exit()
      .transition()
      .duration(this.duration)
      .attr("y", this.yScale(0))
      .attr("height", 0)
      .remove();

    // Update Title
    this.title.text(`Average Population by Continent (${year})`);
  }

  updateSelection(selectedContinents) {
    this.selectedContinents = new Set(selectedContinents);
    // Update bar strokes based on selection
    this.svg.selectAll(".bar")
      .transition()
      .duration(this.duration)
      .attr("stroke", d => this.selectedContinents.has(d.continent) ? "black" : "none")
      .attr("stroke-width", d => this.selectedContinents.has(d.continent) ? 3 : 0);
  }
}

// Initialize the App
const app = new App(config);
app.init();
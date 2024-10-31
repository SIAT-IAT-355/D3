import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const platformCount2017 = [
  { platform: "PS2", count: 400 },
  { platform: "DS", count: 2152 },
  { platform: "PS3", count: 1331 },
  { platform: "Wii", count: 1320 },
  { platform: "X360", count: 1262 },
  { platform: "PSP", count: 1209 },
  { platform: "PC", count: 4500 },
  { platform: "XB", count: 150 },
  { platform: "GBA", count: 120 },
];

const platformData2024 = [
  { platform: "DS", count: 1500 },
  { platform: "PS2", count: 2500 },
  { platform: "PS3", count: 500 },
  { platform: "PS4", count: 4500 },
  { platform: "PS5", count: 8000 },
  { platform: "Wii", count: 1321 },
  { platform: "X360", count: 750 },
  { platform: "PSP", count: 10 },
  { platform: "PC", count: 5000 },
];

async function makeVis() {
  const width = 640;
  const height = 400;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 40;

  const svg = d3.create("svg").attr("width", width).attr("height", height);
  viscontainer.append(svg.node());

  const xAxis = svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0, ${height - marginBottom})`);
  const yAxis = svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${marginLeft}, 0)`);
  // sample data for count of platforms

  let data = platformCount2017;
  let xScale;
  let yScale;
  let sortByCount = false;

  const setScales = () => {
    // sort data on platform
    data.sort((a, b) => d3.ascending(a.platform, b.platform));
    // if sortByCount is true, sort data on count
    if (sortByCount) {
      data.sort((a, b) => d3.descending(a.count, b.count));
    }
    xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.platform))
      .range([marginLeft, width - marginRight])
      .padding(0.1);

    yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .range([height - marginBottom, marginTop]);

    return { xScale, yScale };
  };

  const drawVis = () => {
    // create bars
    setScales();

    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .transition()
      .attr("x", (d) => xScale(d.platform))
      .attr("y", (d) => yScale(d.count))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - marginBottom - yScale(d.count))
      .attr("fill", "steelblue");

    // create x-axis

    xAxis.transition().call(d3.axisBottom(xScale));

    yAxis.transition().call(d3.axisLeft(yScale));

    d3.select("#make2017").on("click", () => {
      data = platformCount2017;
      drawVis();
    });

    d3.select("#make2024").on("click", () => {
      data = platformData2024;
      drawVis();
    });

    d3.select("#sort").on("click", () => {
      sortByCount = !sortByCount;
      //change the text of the button
      d3.select("#sort").text(
        sortByCount ? "Sort by platform" : "Sort by count"
      );
      drawVis();
    });
  };

  drawVis();
}

makeVis();

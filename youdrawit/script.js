document.addEventListener("DOMContentLoaded", function () {
  // Data and chart setup
  const data = [
    { year: 2000, value: 100 },
    { year: 2001, value: 120 },
    { year: 2002, value: 150 },
    { year: 2003, value: 170 },
    { year: 2004, value: 160 },
    { year: 2005, value: 180 },
    { year: 2006, value: 190 }, // Hidden values
    { year: 2007, value: 200 },
    { year: 2008, value: 220 },
    { year: 2009, value: 240 },
    { year: 2010, value: 260 },
  ];

  const startYear = 2002;

  const margin = { top: 50, right: 50, bottom: 50, left: 70 };
  const width = 1000 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#line-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    // .style("background", "#f5f5f5")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year))
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) + 50])
    .range([height, 0]);

  // Gridlines
  function make_x_gridlines() {
    return d3.axisBottom(x).ticks(data.length);
  }

  function make_y_gridlines() {
    return d3.axisLeft(y).ticks(5);
  }

  // Add the X gridlines
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(make_x_gridlines().tickSize(-height).tickFormat(""));

  // Add the Y gridlines
  svg
    .append("g")
    .attr("class", "grid")
    .call(make_y_gridlines().tickSize(-width).tickFormat(""));

  // Axes
  svg
    .append("g")
    .attr("class", "axis-x-line")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.format("d")));

  svg.append("g").attr("class", "axis-y-line").call(d3.axisLeft(y));

  // Line generator
  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.value))
    .defined((d) => d.value !== null)
    .curve(d3.curveCardinal);

  // User drawn line data
  let userData = data.map((d) => {
    if (d.year >= startYear) {
      return { year: d.year, value: null };
    } else {
      return { ...d };
    }
  });

  const userLine = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.value))
    .defined((d) => d.value !== null)
    .curve(d3.curveCardinal);

  const userPath = svg
    .append("path")
    .datum(userData)
    .attr("class", "user-line");

  // Interaction
  const overlay = svg
    .append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all");

  let isDrawingComplete = false;

  overlay.call(
    d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
  );

  function clamp(a, b, c) {
    return Math.max(a, Math.min(b, c));
  }

  let drawing = false;

  function dragstarted(event) {
    drawing = true;
    userData.forEach((d) => {
      if (d.year >= startYear) {
        d.value = null;
      }
    });
    userPath.datum(userData).attr("d", userLine);
  }

  function dragged(event) {
    if (!drawing) return;
    console.log(event);
    // Corrected mouse position
    const [mx, my] = d3.pointer(event, svg.node());
    console.log([mx, my]);
    const mouseYear = x.invert(mx);
    const mouseValue = y.invert(my);

    // Find the closest data point
    let closestPoint = null;
    let minDiff = Infinity;

    userData.forEach((d) => {
      if (d.year >= startYear) {
        const diff = Math.abs(d.year - mouseYear);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = d;
        }
      }
    });

    if (closestPoint && minDiff < x.invert(10) - x.invert(0)) {
      closestPoint.value = clamp(0, y.domain()[1], mouseValue);

      userPath.datum(userData).attr("d", userLine);

      // Check if user has completed drawing
      const allDefined = userData
        .filter((d) => d.year >= startYear)
        .every((d) => d.value !== null);
      if (allDefined) {
        document.getElementById("show-results").disabled = false;
        isDrawingComplete = true;
      }
    }
  }

  function dragended(event) {
    drawing = false;
  }

  // Show Results
  document
    .getElementById("show-results")
    .addEventListener("click", function () {
      if (isDrawingComplete) {
        // Draw the actual data line
        svg.append("path").datum(data).attr("class", "line").attr("d", line);

        // Optionally, display a message or update the instruction
        document.querySelector(".instruction").textContent =
          "Actual data revealed!";
      }
    });
});

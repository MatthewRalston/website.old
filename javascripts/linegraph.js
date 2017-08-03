


var margin = {top: 30, right: 40, bottom: 50, left: 100},
    width = 900 - margin.left - margin.right,
    height = 600 - margin.left - margin.right,
    svg = d3.select("div#svgcontainer")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.right),
          g = svg.append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y-%m");

var x = d3.scaleTime().rangeRound([0, width]);

var y = d3.scaleLinear().rangeRound([height, 0]);

colorScale = d3.scaleSequential(d3.interpolateGnBu);

var line = d3.line()
    .curve(d3.curveLinear)
    .x(function(d){ return x(d.date)})
    .y(function(d){ return y(d.cost)})
var seq, data, rawdata;


d3.promise.json("/data/multiline.json").then(function(rawData){
  data = rawData;
  rawdata = jQuery.extend(true, {}, rawData);
  return Object.keys(data.genomeSize).map(function(species){ 
    return {
      "label": species,
      "points": JSON.parse(JSON.stringify(data.rawData)).map(function(d){
      	d.species = species;
      	newdate = parseTime(d.datetime).toString();
      	d.date = new Date(newdate);

      	d.cost = d["cost-per-mb"]*data.genomeSize[species];
      	return d;
      }).sort(function(a, b){
      	return a.date - b.date;
      })
    }
  });
}).then(function(pts){
  data.points = pts;
  //console.log("Preprocessing complete...");
  //console.log("Points returned:");

  x.domain([
      d3.min(data.points, function(seq){ return d3.min(seq.points, function(d){ return d.date}) }),
      d3.max(data.points, function(seq){ return d3.max(seq.points, function(d){ return d.date})})
  ]);

  y.domain([
      0,
      d3.max(data.points, function(seq){ return d3.max(seq.points, function(d){ return d.cost})})
  ]);

  colorScale.domain([
    d3.min(data.points, function(seq){ return data.genomeSize[seq.label] }),
    d3.max(data.points, function(seq){ return data.genomeSize[seq.label] })
  ])


  g.append("g")
	.attr("class", "axis axis--x")
	.attr("transform", "translate(0," + height + ")")
	.call(d3.axisBottom(x));
  g.append("text")
        .attr("x", width/2 - 50)
        .attr("y", height + 30)
        .style("fill", "#000")
	.text(data.labels.x);

  g.append("g")
	.attr("class", "axis axis--y")
	.call(d3.axisLeft(y))
  g.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", -90)
        .attr("x", -height/2)
	.attr("dy", "1em")
	.style("fill", "#000")
	.text(data.labels.y);

  seq = g.selectAll(".seq")
	.data(data.points)
	.enter().append("g")
	.attr("class", "seq");


  seq.append("path")
     .attr("class", "line")
     .attr("d", function(s) { 
       //console.log("Making line from these points....");
       //console.log(s.points);
       return line(s.points);
     }).style("stroke", function(d){ return colorScale(data.genomeSize[d.label])});
});


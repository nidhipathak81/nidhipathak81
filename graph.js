/**
 * Creates a bar graph, a pie chart and a legend
 * @param  {Object} config Configuration object having necessary properties
 * @param  {Array} obj    Data object
 */
graphChart = function(config, obj){
	var duration = 500;
	var self = this;
	var marginV = config.marginV?config.marginV:30;
	var marginH = config.marginH?config.marginH:0;
	var ratio = config.ratio?config.ratio:0.5;
	this.totalObj = [];
	var totalHeight = config.height - 2*(marginV);
	var totalWidth = config.width - 2*(marginH);
	var barGraphWidth = ratio*totalWidth; //width assigned to bar graph svg element
	var pieWidth = totalWidth - barGraphWidth;	// width assigned to pie chart svg element
	var barColor = 'steelblue';
	// creates a linear scale to scale down(up) bar's height in accordance to container's height
	var y = d3.scale.linear()
			.range([totalHeight,0]);

	//calculates bar's width
	var x = d3.scale.ordinal()
    			.rangeRoundBands([0, barGraphWidth], .1);

	// x axis of the bar graph
	var xAxis = d3.svg.axis()
					.scale(x)
					.orient('bottom');
	// pie layout
	var pieLayout = d3.layout.pie()
						.value(function(d){ return d[config.valueProp] });
	// scale for color's of pie chart
	var pieColor = d3.scale.ordinal()
						.range(["#807dba","#e08214","#41ab5d",'#2ca02c', '#d62728']);

	function init(){
		var container = d3.select(config.id);
		//svg container for bar graph
		self.chart = container.append('svg')
						.attr('id','graph-chart-svg')
						.attr('width', barGraphWidth)
						.attr('height', config.height)
						.append('g')
						.attr('transform', "translate("+marginH+","+marginV+")");

		self.barGroup = self.chart.append('g')
							.attr('transform', "translate(0,0)");

		//creating svg container for pie chart
		self.pieGroup = container.append('svg')
							.attr('id', 'pie-chart-svg')
							.attr('x', barGraphWidth)
							.attr('height',totalHeight)
							.attr('width', pieWidth)
							.append('g')
							.attr('transform', "translate("+pieWidth/2+","+(totalHeight/2)+")");

		self.totalObj = calculateGraphTotal(obj);

		//creating a table container for legend
		self.legendGroup = container.append('div')
									.attr('id','legend-table')
									.append('table')
									.attr('class','legend');
	}

	//Runs first time and creates an object having the total of
	// values under config.subLabel
	function calculateGraphTotal(data){
		var temp = {};
		var total = 0;
		for(var i in data){
			var subTotal = 0; //sums up all inner objects value
			if(data.hasOwnProperty(i)){
				data[i][config.subProp].forEach(function(item){
					if(!temp[item[config.labelProp]]) temp[item[config.labelProp]] = 0;
					temp[item[config.labelProp]]+=item[config.valueProp];
					subTotal+=item[config.valueProp];
				})
				data[i][config.valueProp] = subTotal;
				total+=data[i][config.valueProp];
			}
		}
		var arr = [];
		//adding a 'percent' property to passed in data
		for(var i in data){
			if(data.hasOwnProperty(i)){
				data[i]['percent'] = Math.round(data[i][config.valueProp]/total*100);
			}
		}
		for(var t in temp){
			if(temp.hasOwnProperty(t)){
				var buffer = {};
				buffer[config.labelProp] = t;
				buffer[config.valueProp] = temp[t];
				arr.push(buffer);
			}
		}
		return arr;
	}

	function createChart(data){
		createBarGraph(self.totalObj);
		createPieChart(data);
		createLegend(data);
	}

	function createBarGraph(data){
		x.domain(data.map(function(d) { return d[config.labelProp]; }));
		self.chart.select('g.x.axis').remove('*');
		self.chart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + totalHeight + ")")
			.call(xAxis);
		y.domain([0, d3.max(data, function(d){
			return d[config.valueProp];
		})])
		var bar = self.barGroup.selectAll('g')
					.data(data, function(d){
						return d[config.valueProp];
					});
		var barEnter = bar.enter().append('g');

		bar.attr('class', 'bar')
			.attr('transform', function(d,i){
				return "translate("+x(d[config.labelProp])+",0)";
			});

		bar.append('rect')
			.attr('y', function(d){ return y(d[config.valueProp]); })
			.attr('width', x.rangeBand())
			.attr('height', function(d){ return totalHeight - y(d[config.valueProp]); })
			.attr('fill',barColor);

		bar.append("text")
			.attr('x', x.rangeBand()/2)
			.attr("y", function(d) { return y(d[config.valueProp]) - 3; })
//			.attr("dy", ".75em")
			.attr('text-anchor', 'middle')
			.text(function(d) { return d[config.valueProp]; });

		bar.exit().remove();
	}

	function updatePieChart(data, color){
		y.domain([0, d3.max(data, function(d){
			return d[config.valueProp];
		})]);
		var bars = self.barGroup.selectAll('g')
						.data(data);
		bars.select("rect").transition().duration(duration)
                .attr("y", function(d) {return y(d[config.valueProp]); })
                .attr("height", function(d) { return totalHeight - y(d[config.valueProp]); })
				.attr("fill",color)
		// transition the frequency labels location and change value.
		bars.select("text").transition().duration(duration)
			.text(function(d){ return (d[config.valueProp])})
			.attr("y", function(d) {return y(d[config.valueProp])-3; });
	}

	function createPieChart(data){
		var oRadius = Math.min(totalHeight, pieWidth)/2;
		var arc = d3.svg.arc()
					.innerRadius(0)
					.outerRadius(oRadius-20);
		var piePath = self.pieGroup.selectAll('path')
						.data(pieLayout(data), function(d){ return d.data.id; })
		piePath.enter().append('path');
		piePath.attr('fill', function(d){ return pieColor(d.data['id']);})
				.attr('stroke', 'white')
				.attr('stroke-width', 0.7)
				.attr('d', arc)
				.on('mouseenter', mouseEnter)
				.on('mouseleave', mouseLeave)

		piePath.exit().remove();
	}

	function createLegend(data){
		var tBody = self.legendGroup.append('tbody');
		var tr = tBody.selectAll('tr')
					.data(data)
					.enter()
					.append('tr');

		tr.append('td').append('svg').attr("width", '16').attr("height", '16')
			.append("rect").attr("width", '16').attr("height", '16')
			.attr('fill',function(d){
				return pieColor(d['id']);
			});
		tr.append('td').html(function(d){return d[config.labelProp]});
		tr.append('td').html(function(d){return d[config.valueProp]});
		tr.append('td').html(function(d){return d['percent']+'%';});

/*
		tr.selectAll('td')
			.data(function(d){
				var temp = {};
				temp[config.labelProp] = d[config.labelProp];
			})
*/
	}

	function mouseEnter(d){
		var color = d3.select(this)
			.attr('fill');
		updatePieChart(d.data[config.subProp], color);
	}

	function mouseLeave(d){
		updatePieChart(self.totalObj, barColor);
	}

	function keyFunc(d,i){
		return d['id'];
	}

	function addXScale(){
		self.barGroup.append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + (height+marginV) + ")")
		  .call(xAxis);
	}

	init();
	createChart(obj);
}

//uploadCSV File into "data"
	var lineData = new Array();
	var flag = 0, z = 0; upload=0;
	
	var map = L.map('map', {
		center : [ 0, 0 ],
		zoom : 3
	});
	// Openstreetmap layer
	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution : '&copy; OpenStreetMap contributors'
	}).addTo(map);
	//First time load using current datetime
	if(upload==0){
		GetClock();
		clock = setInterval(GetClock,1000);	
	} else {
		clearInterval(clock);
	}
	function GetClock(){
		var d=new Date();
		var nmonth=d.getMonth(),ndate=d.getDate(),nyear=d.getYear();
		if(nyear<1000) nyear+=1900;
		var d=new Date();
		var nhour=d.getHours(),nmin=d.getMinutes(),nsec=d.getSeconds();
		if(nmin<=9) nmin="0"+nmin
		if(nsec<=9) nsec="0"+nsec;
		document.getElementById('displaytime').innerHTML=""+ndate+"/"+(nmonth+1)+"/"+nyear+" "+nhour+":"+nmin+":"+nsec+"";
	}
	//
	function myFunction() {//add row dataset table
	    var table = document.getElementById("myTable");
	    var row = table.insertRow(0);
	    var cell1 = row.insertCell(0);
	    var cell2 = row.insertCell(1);
	    cell1.innerHTML = filename;
	    cell2.innerHTML = '<button onclick="render();">&#9658;</button>';
	}
	
		
	$(document).ready(function() {
	// The event listener for the file upload
	document.getElementById('txtFileUpload')
			.addEventListener('change', upload, false); //addEventListener(event,function,useCapture)
	// Method that checks that the browser supports the HTML5 File API
	function browserSupportFileUpload() {
		var isCompatible = false;
		if (window.File && window.FileReader && window.FileList && window.Blob) {
			isCompatible = true;
		}
		return isCompatible;
	}
	
	// Method that reads and processes the selected file
	function upload(evt) {
		upload=1;
		if (!browserSupportFileUpload()) {
			alert('The File APIs are not fully supported in this browser!');
		} else {
		data = null;
		var file = evt.target.files[0];
		filename = evt.target.files[0].name;
		//Add dataset table
			/*var t = $('#example').DataTable();
		    var counter = 1;
		 
		    $('#addRow').on( 'click', function () {
		        t.row.add( [
		            counter +'.1',
		            counter +'.2'
		        ] ).draw();
		 
		        counter++;
		    } );
		    // Automatically add a first row of data
		    $('#addRow').click();*/
		//*******************************************
		var reader = new FileReader();
		reader.readAsText(file);
	reader.onload = function(event) {
		//clear datetime onload
		clearInterval(clock);
		$('#displaytime').empty();
		//convert csv file into geojson
		var csvData = event.target.result;
		data = $.csv.toArrays(csvData); //using jquery.csv-0.71.js
		arr = reformat(data);
		//Convert data into geojson
		geodata = {type : "FeatureCollection", features : csv2geojson(arr)};
		//Convert data into motion format 
		motiondata = reformat2(data);
		// Add row table
		myFunction();
	}; // end of reader.onload
	reader.onerror = function() {
		alert('Unable to read ' + file.fileName);
	};
}}
}); // end of $document
	function render() {
		$('svg.overlay-point').empty();
		//set start time and end time
		var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;
		end = d3.max(geodata.features, function(d){ return d.properties.Time;});
		init = d3.min(geodata.features, function(d){ return d.properties.Time;});
		//init = parseDate('2014-10-04T16:56:49');
		/*end = parseDate('2014-10-04T16:58:49');*/
		//set radius and color
		color = function color(d) { return d.properties.MMSI; };
		radius = function radius(d){ return d.properties.SpeedOverGround; };
		colorScale = d3.scale.category10();
		radiusScale = d3.scale.sqrt().domain([0, 21]).range([0, 10]);
		timeScale = d3.scale.sqrt().domain([init.getTime(), end.getTime()]).range([0, 100]);
		//mtData = '{"type":"FeatureCollection","features":...}';
		//motiondata = JSON.parse(mtData);
		// A bisector 
		 bisect = d3.bisector(function(d) { return d[0]; });
		 someData = interpolateData(init);
		
		$( "#slidertime" ).slider({
				value: timeScale(init.getTime()),
				orientation: "horizontal",
				range: "min",
				animate: true,
				//range: true,
	            //min: init.getTime(),
	            //max: end.getTime(),
	            //values: [ init.getTime(), end.getTime() ],
	            slide: function( event, ui ) {
	              //begins = d3.max([ui.values[0], data.length]);
	              //ends = d3.max([ui.values[1], 0]);
	              //console.log("begin:", begins, "end:", ends);
	              //zoom(begin, end);
	              svg_point.transition().duration(0);
	              /*var someData = interpolateData(new Date(begins));
	              svg_point.transition()
					.duration(ends-begins) //set duration n x 1000 second
					.ease("linear")
					.attrTween("year", tweenYear2(begins,ends));*/
	              //tweenYear2(begins,ends); 
	            }
	        });
	   
		/*  function onEachFeature(feature, layer) {
		        var popupContent = TablePopupContent(feature);                             
		        layer.bindPopup(popupContent);
		} */
		//Add sg_geojson
		/* var sg;
		var info = L.control();
		var myStyle = {
		        fillColor: '#C6E2FF',
		        weight: 1,
		        opacity: 1,
		        color: 'blue',
		        dashArray: '1',
		        fillOpacity: 0.5
		               }; */
		/*     sg= L.geoJson(sg_geojson, {
		         style: myStyle  //call style function
		     }).addTo(map); */

		//Add uploaded data point
		myLayer = L.geoJson(geodata,{
			style : function(feature) {return feature.properties && feature.properties.style;},
			//onEachFeature: onEachFeature,
			pointToLayer : function(feature, latlng) {
				return L.circleMarker(latlng,{
					radius : 4,
					fillColor : "none",
					color : "none",
					weight : 1,
					opacity : 1,
					fillOpacity : 0.8
				});
			}
		}).addTo(map);
		//Get boundary from uploaded file, then zoom it
		var bounds = myLayer.getBounds();
		map.fitBounds(bounds, { padding : [ 10, 10 ]});
		//Add layer Control (default position: right top)
		/*   var overlayMaps = {
		         "Layer Background": sg, 
		         "Uploaded Data": myLayer
		     };
		  L.control.layers(overlayMaps).addTo(map); */
		  
		// Create the SVG displaytime.
		reference = '#displaytime';
		$(reference).empty();
		var width = $(reference).width();
		var height = $(reference).height();
		var svg_dsptime = d3.select(reference)
							.append("svg")
			    			.attr("width", width)
			    			.attr("height", height)
			  				.append("g");
			    			//.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		  
		  
		    
		    /* var width = $(reference).width();
			var height = $(window).height() * 0.2;  // We don't want the height to be responsive.
			var svg2 = d3.select(reference)
						 .append("svg")
						 .attr("viewBox", "0 "+ String(height * -.2) + " " + String(width * 1) + " " + String(height * 1.5))
						 .attr("width", width)
						 .attr("height", height * 1.2);  */
		  
		// set projection
		var projection = d3.geo.mercator();
		// create path variable
		var transform = d3.geo.transform({point : projectPoint});
		 path = d3.geo.path().projection(transform);
		bounds = path.bounds(geodata);
		var topLeft = bounds[0], bottomRight = bounds[1];
		///SVG Point
		 svg_point = d3.select(map.getPanes().overlayPane)
					.append("svg")
					.attr("class","overlay-point")
					.attr("transform","translate(" + -topLeft[0] + ","+ -topLeft[1] + ")");
		g_point = svg_point.append("g")
					.attr("class", "leaflet-zoom-hide");
		//SVG Line
		/* var svg_line = d3.select(map.getPanes().overlayPane)
					.append("svg")
					.attr("class", "overlay-line")
					.attr("transform","translate(" + -topLeft[0]+ "," + -topLeft[1]+ ")");
		g_line = svg_line.append("g")
					.attr("class","leaflet-zoom-hide"); */

		//var lineData = [ { "x": 627,   "y": 297},  { "x": 740,  "y": 357}];
		 featurePoint = g_point.selectAll("path")
					.data(someData)/* geodata.features */
					.enter().append("path");
		//var featureLine = g_line.append("path");
		
		svg_point.transition()
					.duration(60000) //set duration n x 1000 second
					.ease("linear")
					.attrTween("year", tweenYear);
		
		// Add the year label; the value is set on transition.
		parseDsptime = d3.time.format("%d/%m/%Y %H:%M:%S");
		init_time = parseDsptime(init);
		label = svg_dsptime.append("text")
		    .attr("class", "year label")
		    .attr("text-anchor", "end")
		    .attr("y", height)
		    .attr("x", width)
		    .style("fill","white")
		    .text(init_time);
		
		
		map.on("viewreset", reset);
		reset();
	}
		function reset() {
			bounds = path.bounds(geodata);
			var topLeft = bounds[0], bottomRight = bounds[1];
			svg_point.attr("width",bottomRight[0] - topLeft[0])
					.attr("height",bottomRight[1]- topLeft[1])
					.style("left",topLeft[0] - 4 + "px")
					.style("top",topLeft[1] - 4 + "px");
			g_point.attr("transform", "translate("+ -topLeft[0] + ","+ -topLeft[1] + ")");
			/* svg_line.attr("width",bottomRight[0] - topLeft[0])
					.attr("height",bottomRight[1]- topLeft[1])
					.style("left",topLeft[0] - 4 + "px")
					.style("top",topLeft[1] - 4 + "px");
			g_line.attr("transform", "translate("+ -topLeft[0] + ","+ -topLeft[1] + ")"); */
			//// initialize the path data 
			flag = 1;
			//var lineData = new Array;
			featurePoint.attr("d", path)
						.style("fill-opacity", 1)
						.style("fill", function(d) { return colorScale(color(d)); })
						.attr("d",path.pointRadius(function(d) { return radiusScale(radius(d)); }) );
						//.attr('fill','#ff7800')
						//.attr("d",path.pointRadius(4)); 
			/* svg_point.transition()
						.duration(10000) //set duration n x 1000 second
						.ease("linear")
						.attrTween("year", tweenYear); */		
			//The data for our line
			//var lineData = [ { "x": 627,   "y": 297},  { "x": 740,  "y": 357}];
			/* var lineFunction = d3.svg.line()
								.x(function(d) {return d.x; })
								.y(function(d) {return d.y; })
								.interpolate("linear");
			featureLine.attr("d",lineFunction(lineData))
					.attr("stroke", "blue")
					.attr("stroke-width", 2)
					.attr("fill","none"); */
		}
		function projectPoint(x, y) {
			if (flag != 1) {
				var point = map.latLngToLayerPoint(new L.LatLng(y, x));
				this.stream.point(point.x, point.y);
			} else {
				if (z == 0) {
					lineData = [];
				}
				var obj = {};
				var point = map.latLngToLayerPoint(new L.LatLng(y, x));
				//this.stream.point(point.x, point.y);
				obj.x = point.x;
				obj.y = point.y;
				lineData.push(obj);
				z += 1;
				if (z < motiondata.length) {
					/*nothing*/
				} else {
					flag = 0; z = 0;
				}
			}}
		// Positions the dots based on data.
		function position(featurePoint) {
				featurePoint.attr("d", path);
		}
		// Defines a sort order so that the smallest dots are drawn on top.
		function order(a, b) {
		    return radius(b) - radius(a);
		}
		// Tweens the entire chart by first tweening the year, and then the data.
		  // For the interpolated data, the dots and label are redrawn.
		function tweenYear() {
		    var year = d3.interpolateNumber(init, end);
		    return function(t) { /* addTrace(year(t)); */  displayYear(year(t));  };
		  }
		function tweenYear2() {
		    var year = d3.interpolateNumber(begins, ends);
		    return function(t) { /* addTrace(year(t)); */  displayYear(year(t));  };
		  }
		// Updates the display to show the specified year.
		function displayYear(year) {
			featurePoint.data(interpolateData(year), function(d) { return d.properties.MMSI; })
		    	.call(position)
		    	.sort(order);
			//theLabel.data(interpolateData(year), key).call(position2).sort(order);
			timedsp = parseDsptime(new Date(year));
		    label.text(timedsp);
		}
		// Interpolates the dataset for the given (fractional) year.
		function interpolateData(year) {
			return motiondata.map(function(d) {
				return {
					properties : {MMSI: d.MMSI, SpeedOverGround: interpolateValues(d.SpeedOverGround,year)},
					type: "Feature",
					geometry : {coordinates : [interpolateValues(d.Longitude, year),interpolateValues(d.Latitude, year)],type: "Point"}
				};
			});
		}
		// Finds (and possibly interpolates) the value for the specified year.
		function interpolateValues(values, year) {
			var i = bisect.left(values, year, 0,
					values.length - 1), a = values[i];
			if (i > 0) {
				var b = values[i - 1], 
					t = (year - a[0])/(b[0] - a[0]);
				if(t >= 0){
					return a[1] * (1 - t) + b[1] * t;}
				else {
					return a[1];
				}
			}
			return a[1];
		};
		
		function render_sample1() {
			//clear datetime onload
			clearInterval(clock);
			$('#displaytime').empty();
			//convert csv file into geojson
			arr = reformat(data1);
			//Convert data into geojson
			geodata = {type : "FeatureCollection", features : csv2geojson(arr)};
			//Convert data into motion format 
			motiondata = reformat2(data1);
			// Add row table
			$('svg.overlay-point').empty();
			//set start time and end time
			var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;
			end = d3.max(geodata.features, function(d){ return d.properties.Time;});
			init = d3.min(geodata.features, function(d){ return d.properties.Time;});
			duration = (end-init)/12;
			//set radius and color
			color = function color(d) { return d.properties.MMSI; };
			radius = function radius(d){ return d.properties.SpeedOverGround; };
			colorScale = d3.scale.category10();
			radiusScale = d3.scale.sqrt().domain([0, 21]).range([0, 10]);
			timeScale = d3.scale.sqrt().domain([init.getTime(), end.getTime()]).range([0, 100]);
			// A bisector 
			 bisect = d3.bisector(function(d) { return d[0]; });
			 someData = interpolateData(init);
			
			$( "#slidertime" ).slider({
				value: timeScale(init.getTime()),
				orientation: "horizontal",
				range: "min",
				animate: true,
				//range: true,
	            //min: init.getTime(),
	            //max: end.getTime(),
	            //values: [ init.getTime(), end.getTime() ],
	            slide: function( event, ui ) {
	            	svg_point.transition().duration(0);
	            	displayYear(timeScale.invert(ui.value));
	            	$( "#slidertime" ).slider({value: ui.value});
	              //begins = d3.max([ui.values[0], data.length]);
	              //ends = d3.max([ui.values[1], 0]);
	              //console.log("begin:", begins, "end:", ends);
	              //zoom(begin, end);
	            	
	              
	              /*var someData = interpolateData(new Date(begins));
	              svg_point.transition()
					.duration(ends-begins) //set duration n x 1000 second
					.ease("linear")
					.attrTween("year", tweenYear2(begins,ends));*/
	              //tweenYear2(begins,ends); 
	            }});
		    //Add uploaded data point
			myLayer = L.geoJson(geodata,{
				style : function(feature) {return feature.properties && feature.properties.style;},
				//onEachFeature: onEachFeature,
				pointToLayer : function(feature, latlng) {
					return L.circleMarker(latlng,{
						radius : 4,
						fillColor : "none",
						color : "none",
						weight : 1,
						opacity : 1,
						fillOpacity : 0.8
					});
				}
			}).addTo(map);
			//Get boundary from uploaded file, then zoom it
			var bounds = myLayer.getBounds();
			map.fitBounds(bounds, { padding : [ 10, 10 ]});
			// Create the SVG displaytime.
			reference = '#displaytime';
			$(reference).empty();
			var width = $(reference).width();
			var height = $(reference).height();
			var svg_dsptime = d3.select(reference)
								.append("svg")
				    			.attr("width", width)
				    			.attr("height", height)
				  				.append("g");
			// set projection
			var projection = d3.geo.mercator();
			// create path variable
			var transform = d3.geo.transform({point : projectPoint});
			 path = d3.geo.path().projection(transform);
			bounds = path.bounds(geodata);
			var topLeft = bounds[0], bottomRight = bounds[1];
			///SVG Point
			 svg_point = d3.select(map.getPanes().overlayPane)
						.append("svg")
						.attr("class","overlay-point")
						.attr("transform","translate(" + -topLeft[0] + ","+ -topLeft[1] + ")");
			g_point = svg_point.append("g")
						.attr("class", "leaflet-zoom-hide");
			
			featurePoint = g_point.selectAll("path")
						.data(someData)/* geodata.features */
						.enter().append("path");
					
			svg_point.transition()
						.duration(duration) //set duration n x 1000 second
						.ease("linear")
						.attrTween("year", tweenYear);
			$( ".ui-slider-range.ui-widget-header.ui-slider-range-min" ).animate({
			    width: "100%",
			  }, duration );
			//ui-slider-handle ui-state-default ui-corner-all
			$( ".ui-slider-handle.ui-state-default.ui-corner-all" ).animate({
			    left: "100%",
			  }, duration );
			
			// Add the year label; the value is set on transition.
			parseDsptime = d3.time.format("%d/%m/%Y %H:%M:%S");
			init_time = parseDsptime(init);
			label = svg_dsptime.append("text")
			    .attr("class", "year label")
			    .attr("text-anchor", "end")
			    .attr("y", height)
			    .attr("x", width)
			    .style("fill","white")
			    .text(init_time);
			map.on("viewreset", reset);
			reset();
		}	
	
	
function reformat(data){
    	var arr = [];
        var header = data[0]; //header from csv
        for(var i=1;i<data.length;i++){
              var obj = {};
              for(var j=0;j<header.length;j++){
              var currentline=data[i][j];
	          obj[header[j]] = currentline;
	          }
	    arr.push(obj);
        }
return arr;
}

function csv2geojson(arr) {
	jsondata = [];
	i=-1;
	if(arr[0].hasOwnProperty("Latitude")){
		var typ ='Point';
	}
	arr.map(function (d){
		i += 1;
		var coord = new Array();
		var prop = new Object();
		var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;
		for (var key in d){
			if (d.hasOwnProperty(key)) {
    			if(key == "Longitude"){
    				coord[0]=+d[key];
    			} else if(key == "Latitude"){
    				coord[1]=+d[key];
    			} 
    		if(key == "Time"){
	    			prop[key]= parseDate(d[key]);
	    		}else {
	    			prop[key]=d[key];
	    		}
  			}
		}
		jsondata.push({properties : prop,
					   type: "Feature",
					   geometry : {
					   	coordinates : coord,
					   	type: typ
					   }
		})
	});
	return jsondata;
}

function reformat2(data){ //Unfinish
	var arr2 = [];
    var header = data[0];	 //header from csv
    var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;
    var uniq = [];
	var counts = {};
	function onlyUnique(value, index, self) { 
		return self.indexOf(value) === index;
	}
	for(i=1;i<data.length;i++){
		uniq.push(data[i][0]);
	}
	uniq.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });
	//var unique = uniq.filter( onlyUnique );
	var res =[]; var output = [];
	for(i=0; i < Object.keys(counts).length; i++){
		var n = counts[Object.keys(counts)[i]];
		for(j=1; j < data.length; j++){
			var obj = {};
			

			if(data[j][0] == Object.keys(counts)[i]){
				for(k=0; k < data[j].length; k++){
					if(header[k] == "Time"||
					   header[k] == "SpeedOverGround" || 
					   header[k] == "Longitude" || 
					   header[k] == "Latitude"){
						if(header[k] == "Time"){ obj[header[k]] = parseDate(data[j][k]);} else {
						obj[header[k]] = +data[j][k];	}
					} else {
					obj[header[k]] = data[j][k];
					}
				}
				res.push(obj);
				if(res.length == n){
					var newobj = {};
					//initial object
					for (var key in res[0]){
							if (res[0].hasOwnProperty(key)) {
								if(key == "SpeedOverGround" ||
								   key == "Longitude" ||
								   key == "Latitude"){
									newobj[key] = new Array();
								} else if(key == "Time"){
									temp = res[0][key];
								} else {
									newobj[key]=res[0][key];
								}
							}
					}
					//Adding the Time Array
					var coord = new Array();
					res.map(function (d){
						var prop = new Object();
						for (var key in d){
							if (d.hasOwnProperty(key)) {
								if(key == "SpeedOverGround"){
									coord[1]=d[key];
									coord[0]=d["Time"];
								} else if(key == "Longitude"){
									coord[2]=d[key];
								} else if(key == "Latitude"){
									coord[3]=d[key];
								}
							}
						}
						newobj["SpeedOverGround"].push([coord[0],coord[1]]);
						newobj["Longitude"].push([coord[0],coord[2]]);
						newobj["Latitude"].push([coord[0],coord[3]]);
					});
				}

			}
		}
		output.push(newobj);
		var res = [];
	}

   
return output;
    
}

function TablePopupContent(d){
	//var popupContent = "<table><tr><td>MMSI</td><td>"+ feature.properties.MMSI +"</td></tr></table>";
	var arry = new Array();
	var str1 = '<table>'
	var str7 = '</table>';
	var str2 = '<tr><td>';
	var str2alt = '<tr class="alt"><td>';
	var str4 = '</td><td>';
	var str6 = '</td></tr>';
	for(var i=0; i < Object.keys(d.properties).length; i++){
		var str3 = Object.keys(d.properties)[i];
		var str5 = d.properties[str3];
		if(i%2 == 0){
			arry.push(str2alt.concat(str3,str4,str5,str6));
		} else {
			arry.push(str2.concat(str3,str4,str5,str6));}
		}
	var sent='';
	for(var i=0; i < arry.length; i++){
		sent = sent.concat(arry[i]); 
	}
	var res = str1.concat(sent,str7);
	return res;
}

/*function LData(data) {
	//var lineData = [ { "x": 627,   "y": 297},  { "x": 740,  "y": 357}];
	var arry = new Array();
	for(i=0; i<data.length;i++){
		var obj = {};
		obj.x=data[i][0];
		obj.y=data[i][1];
		arry.push(obj);
	}
	return arry;
}*/

/*function projectPoint(x,y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		this.stream.point(point.x, point.y);
}

function projectPoint2(x,y) {
	for(i=0;i<geodata.features.length;i++){
		  var obj = {};
		  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		  //this.stream.point(point.x, point.y);
		  obj.x=point.x;
		  obj.y=point.y;
		  lineData.push(obj);	  
	  }
}*/


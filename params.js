// generates the parameters and a ui in the parent html elemtn
// returns an object with parameter values
// use params.set(pname, value) to set a parameter and update the inputs
function paramsGenerate(parent, parameters) {
	params = {};
	console.log(parameters)
	for (pname in parameters) {
		var param = parameters[pname];
		var paragraph;
		var input;
		var slider;
		paragraph = document.createElement("p");
		paragraph.innerHTML = "<div style='display:inline-block;width:150px;'>" + pname + "</div>";
		
		input = document.createElement("INPUT");
		input.setAttribute("type", "number");
		input.setAttribute("min", param.min);
		input.setAttribute("max", param.max);
		input.setAttribute("value", param.default);
		input.setAttribute("style", "width: 40px");
		
		slider = document.createElement("INPUT");
		slider.setAttribute("type", "range");
		slider.setAttribute("min", param.min);
		slider.setAttribute("max", param.max);	
		slider.setAttribute("value", param.default);
		slider.width = 150;
		
		parent.appendChild(paragraph);
		paragraph.appendChild(input);
		paragraph.appendChild(slider);
		
		let name_closure = pname;
		// this one forces the value to be in range
		input.onchange = function () {
			//console.log("input", name_closure, input.value, this.value);
			params.Set(name_closure, this.value);
		};
		// this one is more active
		slider.addEventListener('input', function (e) {
			params.Set(name_closure, e.target.value);
			//console.log("slide", name_closure, e.target.value);
		});

		params[pname] = {
			"paragraph" : paragraph,
			"slider" : slider,
			"input" : input,
			"value" : param.default
		}
	}
	
	params.Set = function(name, value) {
		if (!(name in params)) return;
		var config = parameters[name];
		
		var new_value = parseInt(value);
		if (value > config.max) new_value = config.max;
		if (value < config.min) new_value = config.min;
		
		//console.log("set value", new_value, typeof(new_value), value);
		current = params[name];
		current.slider.value = new_value;
		current.input.value = new_value;
		current.value = new_value;
	};
	
	return params;
}
/* Sample usage

parameters = {
	'circle_radius_min' : {
		'min' : 1,
		'max' : 500,
		'default' : 50
	},
	'circle_radius_max' : {
		'min' : 1,
		'max' : 500,
		'default' : 100
	},
	'num_targets' : {
		'min' : 1,
		'max' : 40,
		'default' : 3
	},
	'spawn_width' : {
		'min' : 0,
		'max' : 800,
		'default' : 600
	},
	'spawn_height' : {
		'min' : 0,
		'max' : 600,
		'default' : 500
	},
	'hint_radius' : {
		'min' : 0,
		'max' : 500,
		'default' : 10
	}
}

params = paramsGenerate(document.body, parameters);
params.set('num_targets', 11);
params.num_targets.value

*/


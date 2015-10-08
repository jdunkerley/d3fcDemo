(function() {
	'use strict';

	// ToDo: Navigation Panel
	// ToDo: DateTime Axis	

	function createPanelObject(svgPanel) {
		var panelObject = {};
		panelObject.panel = svgPanel;
		panelObject.multi = fc.series.multi();
		
        panelObject.chart = fc.chart.linearTimeSeries()
            .yNice().yTicks(4)
            .plotArea(panelObject.multi);
			
		panelObject.getYDomain = function(data) { return [0,1]; }	
			
		panelObject.dataSet = function(data, dateDomain) {			
			var yDomain = panelObject.getYDomain(data);
			
			panelObject.chart
				.xDomain(dateDomain)
				.yDomain(yDomain);
							
			panelObject.panel
				.datum(data)
				.call(panelObject.chart);	
		};

		return panelObject;
	}

	function addCrossHairs(panelObject, dataFn) {
		panelObject.crosshairsData = [];
		panelObject.crosshairs = fc.tool.crosshair()
			.xLabel('')
            .yLabel('');
			
		panelObject.multi.mapping(function(series) {
				if (series === panelObject.crosshairs) {
					return panelObject.crosshairsData;
				}
				return dataFn();
			});
		return panelObject.crosshairs;
	}
	
	function connectCrossHairs(panels) {
		var renderFn = function() { render(panels); };

		for (var idx = 0; idx < panels.length; idx++) {
			var crosshairs = panels[idx].crosshairs;
			if (!crosshairs) {
				continue;
			}
			
			crosshairs
				.snap(unifiedSnapFunction(panels[idx], panels))
				.on('trackingstart.link', renderFn)
				.on('trackingmove.link', renderFn)
				.on('trackingend.link', function() { trackingEnd(panels); });			
		}
	}
	
	function trackingEnd(panels) {
		for (var idx = 0; idx < panels.length; idx++) {
			if (!panels[idx].crosshairs) {
				continue;
			}
			
			panels[idx].crosshairsData.pop();
		}
			
		render(panels);
	}
	
	function unifiedSnapFunction(chartObject, panels) {
		return function(xPixel, yPixel) {
			var match = fc.util.pointSnap(
				chartObject.series.xScale(),
				chartObject.series.yScale(),
				chartObject.series.xValue(),
				chartObject.series.yValue(),
				panels.data,
				function(x,y,cx,cy) { return Math.abs(cx - x); })(xPixel, yPixel);
				
			for (var idx = 0; idx < panels.length; idx++) {
				if (panels[idx] === chartObject) {
					continue;
				}
				
				if (!panels[idx].crosshairs) {
					continue;
				}				
				
				var newMatch = {
					datum: match.datum,
					x: match.datum ? panels[idx].series.xValue()(match.datum) : match.x,
					xInDomainUnits: match.xInDomainUnits,
					y: match.datum ? panels[idx].series.yValue()(match.datum) : match.y,
					yInDomainUnits: match.yInDomainUnits
				};
				
				panels[idx].crosshairsData[0] = newMatch;
			}			
			
			return match;
		} 
	}
	
	function mainChartCreate(svgPanel) { 				
		var panelObject = createPanelObject(svgPanel);
		var dataFn = function() { return panelObject.panel.datum(); };
		var series = panelObject.multi.series();

		panelObject.chart.xTicks(0);

		series.push(fc.annotation.gridline());
				
		panelObject.series = fc.series.candlestick()
			.xValue(function(d,i) { return d.Date; })
			.yOpenValue(function(d,i) { return d.Open; })
			.yHighValue(function(d,i) { return d.High; })
			.yLowValue(function(d,i) { return d.Low; })
			.yCloseValue(function(d,i) { return d.Close; });
		series.push(panelObject.series);
		panelObject.getYDomain = function(data) { return fc.util.extent(data, ['High', 'Low']); };
		
		series.push(addCrossHairs(panelObject, dataFn));
			
		return panelObject;
	}
	
	function volumeChartCreate(svgPanel) {
		var panelObject = createPanelObject(svgPanel);
		var dataFn = function() { return panelObject.panel.datum(); };
		var series = panelObject.multi.series();
		
		panelObject.chart.yTicks(2);

		series.push(fc.annotation.gridline());
				
		panelObject.series = fc.series.bar()
			.xValue(function(d,i) { return d.Date; })
			.yValue(function(d,i) { return d.Volume; });
		series.push(panelObject.series);
		panelObject.getYDomain = function(data) { return [0, d3.max(data, function(d,i) { return d.Volume || 0; })]; };
		
		series.push(addCrossHairs(panelObject, dataFn));		
			
		return panelObject;
	}

	function createPanelSVG(container, width, height) {
		return container
			.append('svg')
			.attr({
				width: width,
				height: height
			});
	}
	
	function render(panels) {
		for (var idx = 0; idx < panels.length; idx++) {
			panels[idx].dataSet(panels.data, panels.dateDomain);			
		}

	}
	
	function setData(panels, data) {
		panels.data = data;
		panels.dateDomain = fc.util.extent(data, 'Date');
		render(panels);
	}
	
	
	
	angular.module('d3Test.ohlcvChart')
		.directive('d3fcChart', [function() {
		return {
			restrict: 'E',
			scope: {
				data: '='
			},
			link: function(scope, element, attribs) {
				var container = d3.select(element[0]);
				
				// Create Chart Panels
				var width = attribs.width || 1140;
				var height = attribs.height || 800;
				var panels = [
					mainChartCreate(createPanelSVG(container, width, height * 0.8)),
					volumeChartCreate(createPanelSVG(container, width, height * 0.2)),
				];
							
				// Connect CrossHairs
				connectCrossHairs(panels);

				// Connect Zooms
									
				// This will be called on data set
				scope.render = function(data) {
					setData(panels, data || []);					
				};
				
				scope.$watch('data', function() {
					scope.render(scope.data);
				}, true);
			}
		};
	}]);
})();

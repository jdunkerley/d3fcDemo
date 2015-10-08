(function() {
	'use strict';

	// ToDo: Navigation Panel
	// ToDo: Joined Cross Hairs Need to Pick correct Y for each point
	
	function joinCrossHairs(panels) {
		var crosshairData;
		var renderFn = function() { render(panels); };
		
		for (var panelIdx = 0; panelIdx < panels.length; panelIdx++) {
			var panel = panels[panelIdx];
			if (!panels[panelIdx].crosshairs) {
				continue;
			}			
			
			if (!crosshairData) {
				crosshairData = panel.crosshairsData;
			}
			
			panel.crosshairsData = crosshairData;		
			panel.crosshairs.on('trackingstart.link', renderFn);
			panel.crosshairs.on('trackingmove.link', renderFn);
			panel.crosshairs.on('trackingend.link', renderFn);
		}
	}

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
					
			if (panelObject.crosshairs) {
				panelObject.crosshairs
					.snap(fc.util.seriesPointSnap(panelObject.series, data));
			}
							
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
				joinCrossHairs(panels);

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

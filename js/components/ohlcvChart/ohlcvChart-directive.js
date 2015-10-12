/* global angular, fc, d3 */
(function () {
    'use strict';

    // ToDo: Add rect to navigator panel

    function createPanelObject(svgPanel) {
        var panelObject = {};
        panelObject.panel = svgPanel;
        panelObject.multi = fc.series.multi();

        panelObject.chart = fc.chart.linearTimeSeries()
            .xDiscontinuityProvider(fc.scale.discontinuity.skipWeekends())
            .yNice().yTicks(4)
            .plotArea(panelObject.multi);

        panelObject.getYDomain = function (data) { return [0, 1]; };

        panelObject.dataSet = function (data, dateDomain, fullDomain) {
            var yDomain = panelObject.getYDomain(
                panelObject.navigator ? data : data.filter(function(d) {
                    return d.date >= dateDomain[0] && d.date <= dateDomain[1];
                }));

            panelObject.chart
                .xDomain(panelObject.navigator ? fullDomain : dateDomain)
                .yDomain(yDomain);

            if (panelObject.zoom) {
                panelObject.zoom.x(panelObject.chart.xScale());
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

        panelObject.multi.mapping(function (series) {
            if (series === panelObject.crosshairs) {
                return panelObject.crosshairsData;
            }
            if (series === panelObject.brush) {
                return panelObject.brushData;
            }
            return dataFn();
        });
        return panelObject.crosshairs;
    }

    function connectCrossHairs(panels) {
        var renderFn = function () { render(panels); };
        var trackingEndFn = function () { trackingEnd(panels); };

        for (var idx = 0; idx < panels.length; idx++) {
            var crosshairs = panels[idx].crosshairs;
            if (crosshairs) {
                crosshairs
                    .snap(unifiedSnapFunction(panels[idx], panels))
                    .on('trackingstart.link', renderFn)
                    .on('trackingmove.link', renderFn)
                    .on('trackingend.link', trackingEndFn);
            }
        }
    }

    function trackingEnd(panels) {
        panels
            .filter(function(p) { return p.crosshairsData; })
            .forEach(function(p) { p.crosshairsData.pop(); });
        render(panels);
    }

    function unifiedSnapFunction(chartObject, panels) {
        return function (xPixel, yPixel) {
            var match = fc.util.seriesPointSnapXOnly(
                chartObject.series,
                panels.data)(xPixel, yPixel);

            panels
                .filter(function(p) { return p !== chartObject && p.crosshairsData; })
                .forEach(function(p) {
                    var newMatch = {
                        datum: match.datum,
                        x: match.datum ? p.series.xValue()(match.datum) : match.x,
                        xInDomainUnits: match.xInDomainUnits,
                        y: match.datum ? p.series.yValue()(match.datum) : match.y,
                        yInDomainUnits: match.yInDomainUnits
                    };

                    p.crosshairsData[0] = newMatch;
                });

            return match;
        };
    }

    function mainChartCreate(svgPanel) {
        var panelObject = createPanelObject(svgPanel);
        var dataFn = function () { return panelObject.panel.datum(); };
        var series = panelObject.multi.series();

        panelObject.chart.xTicks(0);
        panelObject.chart.yTicks(4);
        series.push(fc.annotation.gridline().yTicks(12));

        panelObject.series = fc.series.candlestick();
        series.push(panelObject.series);
        panelObject.getYDomain = function (data) { return fc.util.extent(data, ['high', 'low']); };

        series.push(
            addCrossHairs(panelObject, dataFn)
                .yLabel(function(d) { return d.datum ? d.datum.close : null; }));

        return panelObject;
    }

    function barChartPanel(svgPanel, property) {
        var panelObject = createPanelObject(svgPanel);
        var dataFn = function () { return panelObject.panel.datum(); };
        var series = panelObject.multi.series();

        panelObject.chart.yTicks(2);
        series.push(fc.annotation.gridline().yTicks(4));

        panelObject.series = fc.series.bar()
            .yValue(function (d, i) { return d[property]; });
        series.push(panelObject.series);

        panelObject.getYDomain = function (data) { return [0, d3.max(data, function (d, i) { return d[property] || 0; })]; };

        series.push(
            addCrossHairs(panelObject, dataFn)
                .yLabel(function(d) { return d.datum ? d.datum[property] : null; }));

        return panelObject;
    }

    function zoomChartPanel(svgPanel, property) {
        var panelObject = createPanelObject(svgPanel);
        var dataFn = function () { return panelObject.panel.datum(); };
        var series = panelObject.multi.series();

        panelObject.navigator = true;

        panelObject.chart.yTicks(0);
        series.push(fc.annotation.gridline().yTicks(0));

        panelObject.series = fc.series.line()
            .yValue(function (d, i) { return d[property]; });
        series.push(panelObject.series);

        series.push(
            fc.series.area()
                .yValue(function (d, i) { return d[property]; }));

        panelObject.getYDomain = function (data) { return [0, d3.max(data, function (d, i) { return d[property] || 0; })]; };

        series.push(
            addCrossHairs(panelObject, dataFn)
                .decorate(function(s) {
                    s.selectAll('.annotation line')
                        .attr('style', 'stroke:none'); // Stops lines being render
                    s.selectAll('circle')
                        .attr('style', function(d) { return d.datum.close < d.datum.open ? 'fill:red' : 'fill:green'; });
                }));



        return panelObject;
    }

    function connectZooms(panels) {
        panels.filter(function(p) { return !p.navigator; })
            .forEach(function(p) {
                p.zoom = d3.behavior.zoom()
                    .on('zoom', function() {
                        panels.dateDomain[0] = p.chart.xDomain()[0];
                        panels.dateDomain[1] = p.chart.xDomain()[1];
                        render();
                    });

                p.panel.call(p.zoom);
            });
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
        if (panels) {
            panels.forEach(function(p) {
                p.dataSet(panels.data, panels.dateDomain, panels.fullDomain);
            });
        }
    }

    function setData(panels, data) {
        panels.data = data;
        panels.fullDomain = fc.util.extent(data, 'date');

        if (panels.fullDomain && panels.fullDomain[1]) {
            if (!panels.dateDomain) {
                // Default to 3 Months
                var max = panels.fullDomain[1];
                panels.dateDomain = [new Date(max.getFullYear(), max.getMonth() - 3, max.getDay()), max];
            }

            if (panels.dateDomain[0] < panels.fullDomain[0]) {
                panels.dateDomain[0] = panels.fullDomain[0];
            }

            if (panels.dateDomain[1] > panels.fullDomain[1]) {
                panels.dateDomain[1] = panels.fullDomain[1];
            }
        }

        render(panels);
    }

    angular.module('d3Test.ohlcvChart')
        .directive('d3fcChart', [function () {
            return {
                restrict: 'E',
                scope: {
                    data: '='
                },
                link: function (scope, element, attribs) {
                    var container = d3.select(element[0]);

                    // Create Chart Panels
                    var width = attribs.width || 1140;
                    var height = attribs.height || 800;
                    var panels = [];
                    panels.push(mainChartCreate(createPanelSVG(container, width, height * 0.7)));
                    panels.push(barChartPanel(createPanelSVG(container, width, height * 0.2), 'volume'));
                    panels.push(zoomChartPanel(createPanelSVG(container, width, height * 0.1), 'close'));

                    // Connect CrossHairs
                    connectCrossHairs(panels);

                    // Connect Zooms
                    connectZooms(panels);

                    // This will be called on data set
                    scope.render = function (data) {
                        setData(panels, data || []);
                    };

                    scope.$watch('data', function () {
                        scope.render(scope.data);
                    }, true);
                }
            };
        }]);
}());

/* global fc */
var jdunkerleyD3fc = jdunkerleyD3fc || {};

(function() {
    jdunkerleyD3fc.panels = jdunkerleyD3fc.panels || (function() {
        var output = {};

        output.create = function() {
            var panels = [];
            panels.render = function() {
                panels.forEach(function(p) {
                    p.dataSet(panels.data, panels.dateDomain || panels.fullDomain, panels.fullDomain);
                });
            };
            return panels;
        };

        output.addPanel = function(svgPanel) {
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
        };

        return output;
    }());
}());
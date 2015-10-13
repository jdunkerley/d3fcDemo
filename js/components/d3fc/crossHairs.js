/* global fc */
var jdunkerleyD3fc = jdunkerleyD3fc || {};

(function() {
    jdunkerleyD3fc.crosshairs = jdunkerleyD3fc.crosshairs || (function() {
        var output = {};

        function trackingEnd(panels) {
            panels
                .filter(function(p) { return p.crosshairsData; })
                .forEach(function(p) { p.crosshairsData.pop(); });
            panels.render();
        }

        function unifiedSnapFunction(chartObject, panels) {
            return function (xPixel, yPixel) {
                var match = fc.util.seriesPointSnapXOnly(
                    chartObject.series,
                    panels.data)(xPixel, yPixel);

                panels
                    .filter(function(p) { return p !== chartObject && p.crosshairsData; })
                    .forEach(function(p) {
                        p.crosshairsData[0] = {
                            datum: match.datum,
                            x: match.datum ? p.series.xValue()(match.datum) : match.x,
                            xInDomainUnits: match.xInDomainUnits,
                            y: match.datum ? p.series.yValue()(match.datum) : match.y,
                            yInDomainUnits: match.yInDomainUnits
                        };
                    });

                return match;
            };
        }

        output.add = function (panelObject, dataFn) {
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
        };

        output.connect = function(panels) {
            var trackingEndFn = function () { trackingEnd(panels); };

            for (var idx = 0; idx < panels.length; idx++) {
                var crosshairs = panels[idx].crosshairs;
                if (crosshairs) {
                    crosshairs
                        .snap(unifiedSnapFunction(panels[idx], panels))
                        .on('trackingstart.link', panels.render)
                        .on('trackingmove.link', panels.render)
                        .on('trackingend.link', trackingEndFn);
                }
            }
        };

        return output;
    }());
}());

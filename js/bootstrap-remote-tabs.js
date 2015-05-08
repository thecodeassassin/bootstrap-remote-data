var $ = jQuery;
/*!
 *
 * Bootstrap remote data tabs plugin
 * Version 1.2.0
 *
 * Author: Stephen Hoogendijk (TheCodeAssassin)
 *
 * Licensed under the GPLV2 license.
 *
 * @returns {{hasLoadingMask: boolean, load: Function, _executeRemoteCall: Function}}
 * @constructor
 */
var hasLoadingMask = (jQuery().mask ? true : false),
    bootstrapVersion2 = (jQuery().typeahead ? true : false),

// hook the event based on the version of bootstrap
    tabShowEvent = (bootstrapVersion2 ? 'show' : 'show.bs.tab'),
    accordionShowEvent = (bootstrapVersion2 ? 'show' : 'show.bs.collapse'),
    defaultSettings = {
        customLoadFn: null,
        loadFirstTab: false
    },
    customSettings = $.extend({}, defaultSettings);


if (typeof bootstrapRemoteTabSettings != 'undefined') {
    customSettings = $.extend({}, bootstrapRemoteTabSettings);
}

$(function () {
    // try to navigate to the tab/accordion last given in the URL
    var hash = document.location.hash,
        firstTab;
    if (hash) {

        var realHash = hash.split('bs-tab-')[1],
            hasTab = $('[data-toggle=tab][href*=' + realHash + ']');

        if (hasTab) {
            hasTab.click();
        }

        var hasAccordion = $('[data-toggle=collapse][href=' + hash + ']');
        if (hasAccordion) {
            // for some reason we cannot execute the 'show' event for an accordion properly, so here's a workaround
            if (hasAccordion[0] != $('[data-toggle=collapse]:first')[0]) {
                hasAccordion.click();
            }
        }
    }

    firstTab = $('[data-toggle=tab]:first, [data-toggle=collapse]:first');

    if (!customSettings.loadFirstTab && !hasTab) {
        firstTab.click();
    }
});
var RemoteTabs = function (settings) {

    var obj = {
        hasLoadingMask: false,
        settings: settings,
        customLoadFn: settings.customLoadFn,

        /**
         *
         * @param tabEvent
         * @param hasLoadingMask
         */
        load: function (hasLoadingMask) {

            var me = this;

            me.hasLoadingMask = !!hasLoadingMask;

            // enable all remote data tabs
            $('[data-toggle=tab], [data-toggle=collapse]').each(function (k, obj) {
                var bsObj = $(obj),
                    bsDiv,
                    bsData,
                    bsCallback,
                    url,
                    simulateDelay,
                    alwaysRefresh,
                    hasOpenPanel = false,
                    originalObj,
                    showEvent,
                    hash;


                if (typeof bsObj != 'undefined') {

                    if (bsObj.attr('href')) {

                        hash = bsObj.attr('href').split('#')[1];
                        // prevent default hash actions
                        bsObj.on('click', function (e) {
                            $(this).tab('show');
                            window.location.hash = 'bs-tab-'+hash;
                            e.preventDefault();
                        });

                        // check if the tab has a data-url property
                        if (bsObj.is('[data-tab-url]')) {
                            url = bsObj.attr('data-tab-url');
                            bsDiv = $('#' + hash);
                            bsData = bsObj.attr('data-tab-json') || [];
                            bsCallback = bsObj.attr('data-tab-callback') || null;
                            simulateDelay = bsObj.attr('data-tab-delay') || null;
                            alwaysRefresh = (bsObj.is('[data-tab-always-refresh]')
                            && bsObj.attr('data-tab-always-refresh') == 'true') || null;
                            originalObj = bsObj;
                            showEvent = (bsObj.attr('data-toggle') == 'tab' ? tabShowEvent : accordionShowEvent);

                            if (bsData.length > 0) {
                                try {
                                    bsData = $.parseJSON(bsData);
                                } catch (exc) {
                                    console.log('Invalid json passed to data-tab-json');
                                    console.log(exc);
                                }

                            }

                            if (showEvent == accordionShowEvent) {
                                hasOpenPanel = bsDiv.hasClass('in');
                                // when an accordion is triggered, make the div the triggered object instead of the link
                                if (bootstrapVersion2) {
                                    bsObj = bsObj.parent();
                                } else {
                                    bsObj = bsObj.parents('.panel');
                                }

                                // If there is a panel already opened, make sure the data url is fetched
                                if (hasOpenPanel) {
                                    me._triggerChange(null, url, bsData, bsCallback, bsObj, bsDiv, simulateDelay, alwaysRefresh, originalObj);
                                }
                            }

                            bsObj.on(showEvent, function (e) {
                                me._triggerChange(e, url, bsData, bsCallback, bsObj, bsDiv, simulateDelay, alwaysRefresh, originalObj);
                            });
                        }
                    }
                }
            });
        },

        /**
         * Trigger the change
         *
         * @param e
         * @param url
         * @param bsData
         * @param bsCallback
         * @param bsObj
         * @param bsDiv
         * @param simulateDelay
         * @param alwaysRefresh
         * @param originalObj
         */
        _triggerChange: function (e, url, bsData, bsCallback, bsObj, bsDiv, simulateDelay, alwaysRefresh, originalObj) {
            var me = this;

            // change the hash of the location
            if (e) {
                if (typeof e.target.hash != 'undefined') {
                    window.location.hash = e.target.hash;
                } else {
                    window.location.hash = originalObj.prop('hash');
                }
            }

            if ((!bsObj.hasClass("loaded") || alwaysRefresh) && !bsObj.hasClass('loading')) {

                if (me.customLoadFn) {
                    me.customLoadFn(me, true, bsDiv);
                }

                if (me.hasLoadingMask && !me.settings.custom) {
                    bsDiv.mask('Loading...');
                }
                bsObj.addClass('loading');

                // delay the json call if it has been given a value
                if (simulateDelay) {
                    clearTimeout(window.timer);
                    window.timer = setTimeout(function () {
                        me._executeRemoteCall(url, bsData, bsCallback, bsObj, bsDiv);
                    }, simulateDelay);
                } else {
                    me._executeRemoteCall(url, bsData, bsCallback, bsObj, bsDiv);
                }


            }
        },


        /**
         * Execute the remote call
         * @param url
         * @param customData
         * @param callbackFn
         * @param trigger
         * @param dataContainer
         * @private
         */
        _executeRemoteCall: function (url, customData, callbackFn, trigger, dataContainer) {
            var me = this;


            $.ajax({
                url: url,
                data: customData || [],
                success: function (data) {
                    trigger.removeClass('loading');

                    if (me.customLoadFn) {
                        me.customLoadFn(me, false, dataContainer);
                    }

                    if (me.hasLoadingMask) {
                        dataContainer.unmask();
                    }
                    if (data) {
                        if (typeof window[callbackFn] == 'function') {
                            window[callbackFn].call(null, data, trigger, dataContainer, customData);
                        }
                        if (!trigger.hasClass("loaded")) {
                            trigger.addClass("loaded");
                        }
                        dataContainer.html(data);
                    }
                },
                error: function (data, status, error) {
                    dataContainer.html("An error occured while loading the data: " + error);
                    trigger.removeClass('loading');

                    if (me.customLoadFn) {
                        me.customLoadFn(me, false, dataContainer);
                    }

                    if (me.hasLoadingMask) {
                        dataContainer.unmask();
                    }
                }
            });
        }
    };

    obj.load(hasLoadingMask);

    return obj;
};

var remoteTabsPluginLoaded = new RemoteTabs(customSettings);

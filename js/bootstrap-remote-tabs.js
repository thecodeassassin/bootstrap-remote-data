var $ = jQuery;
/*!
 *
 * Bootstrap remote data tabs plugin
 * Version 1.1.1
 *
 * Author: Stephen Hoogendijk (TheCodeAssassin)
 *
 * Licensed under the GPLV2 license.
 *
 * @returns {{hasLoadingMask: boolean, load: Function, _executeRemoteCall: Function}}
 * @constructor
 */
var hasLoadingMask = (jQuery().mask ? true : false),
    bootstrapVersion2 = (jQuery().typeahead ? true : false);

// hook the event based on the version of bootstrap
var tabShowEvent = (bootstrapVersion2 ? 'show' : 'show.bs.tab');
var accordionShowEvent = (bootstrapVersion2 ? 'show' : 'show.bs.collapse');

$(function() {
    var hash = document.location.hash;
    if (hash) {
       var hasTab = $('.nav-tabs a[href*='+hash+']');	
       if (hasTab) {
            hasTab.tab(tabShowEvent);
       }
   
       var hasAccordion = $('.accordion-heading a[href*='+hash+']');
       if (hasAccordion) {
           hasAccordion.collapse(accordionShowEvent);
       }
    } 
});
var RemoteTabs = function() {

  var obj = {
      hasLoadingMask: false,

      /**
       *
       * @param tabEvent
       * @param hasLoadingMask
       */
      load: function(hasLoadingMask) {

          var me = this;

          me.hasLoadingMask = !!hasLoadingMask;

          // enable all remote data tabs
          $('[data-toggle=tab], [data-toggle=collapse]').each(function(k, tab) {
              var tabObj = $(tab),
                  tabDiv,
                  tabData,
                  tabCallback,
                  url,
                  simulateDelay,
                  alwaysRefresh,
		  hasOpenPanel = false;

              // check if the tab has a data-url property
              if(tabObj.is('[data-tab-url]')) {
                  url = tabObj.attr('data-tab-url');
                  tabDiv = $( '#' + tabObj.attr('href').split('#')[1]);
                  tabData = tabObj.attr('data-tab-json') || [];
                  tabCallback = tabObj.attr('data-tab-callback') || null;
                  simulateDelay = tabObj.attr('data-tab-delay') || null;
                  alwaysRefresh = (tabObj.is('[data-tab-always-refresh]')
                      && tabObj.attr('data-tab-always-refresh') == 'true') || null,
		  showEvent = (tabObj.attr('data-toggle') == 'tab' ? tabShowEvent : accordionShowEvent);

                  if(tabData.length > 0) {
                      try
                      {
                        tabData = $.parseJSON(tabData);
                      } catch (exc) {
                          console.log('Invalid json passed to data-tab-json');
                          console.log(exc);
                      }

                  }
                  
		  if (showEvent == accordionShowEvent) {
		      hasOpenPanel = tabDiv.hasClass('in');	
	              // when an accordion is triggered, make the div the triggered object instead of the link
		      if (bootstrapVersion2) {
  		          tabObj = tabObj.parent();
                      } else {
  		          tabObj = tabObj.parents('.panel');
                      }
			
                      // If there is a panel already opened, make sure the data url is fetched
                      if (hasOpenPanel) {
		          me._triggerChange(null, url, tabData, tabCallback, tabObj, tabDiv, simulateDelay, alwaysRefresh);
	              }
		  }

                  tabObj.on(showEvent, function(e) {
                      me._triggerChange(e, url, tabData, tabCallback, tabObj, tabDiv, simulateDelay, alwaysRefresh);
                  });

              }
          });
    },

    /**
    * Trigger the change
    * 
    * @param e
    * @param objDetails
    */
    _triggerChange: function(e, url, tabData, tabCallback, tabObj, tabDiv, simulateDelay, alwaysRefresh) {
        var me = this;
      
        // change the hash of the location
	if (e && e.target.hash != 'undefined') {
             window.location.hash = e.target.hash;
        }

        if ((!tabObj.hasClass("loaded") || alwaysRefresh) &&
              !tabObj.hasClass('loading')) {

	  if(me.hasLoadingMask) {
	      tabDiv.mask('Loading...');
	  }
	  tabObj.addClass('loading');

	  // delay the json call if it has been given a value
	  if(simulateDelay) {
	      clearTimeout(window.timer);
	      window.timer=setTimeout(function(){
		me._executeRemoteCall(url, tabData, tabCallback, tabObj, tabDiv);
	      }, simulateDelay);
	  } else {
	      me._executeRemoteCall(url, tabData, tabCallback, tabObj, tabDiv);
	  }


        }
    },


      /**
       * Execute the remote call
       * @param url
       * @param customData
       * @param callbackFn
       * @param trigger
       * @param tabContainer
       * @private
       */
    _executeRemoteCall: function(url, customData, callbackFn, trigger, tabContainer) {
        var me = this;


        $.ajax({
            url: url,
            data: customData || [],
            success: function(data) {
                trigger.removeClass('loading');
                if(me.hasLoadingMask) {
                    tabContainer.unmask();
                }
                if (data) {
                    if(typeof window[callbackFn] == 'function') {
                        window[callbackFn].call(null, data, trigger, tabContainer, customData);
                    }
                    if(!trigger.hasClass("loaded")) {
                        trigger.addClass("loaded");
                    }
                    tabContainer.html(data);
                }
            },
            error: function(data, status, error) {
		tabContainer.html("An error occured while loading the data: " + error);
                trigger.removeClass('loading');
                if(me.hasLoadingMask) {
                    tabContainer.unmask();
                }
            }
        });
    }
  };

    obj.load( hasLoadingMask);

    return obj;
};

var remoteTabsPluginLoaded = new RemoteTabs();

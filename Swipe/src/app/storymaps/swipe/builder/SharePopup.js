define(["storymaps/utils/Helper"],
	function (Helper) {
		return function SharePopup(container)
		{
			this.present = function(isFirstSave)
			{
				//isFirstSave = true;
				//app.data.getAppItem().access = "private";

				var appUrl = document.location.protocol + '//' + document.location.host + document.location.pathname + '?appid=' + app.data.getAppItem().id,
					itemUrl = Helper.getItemURL(configOptions.sharingurl, app.data.getAppItem().id),
					webmapUrl = Helper.getItemURL(configOptions.sharingurl, app.data.getWebMapItem().item.id),
					//fsUrl = Helper.getItemURL(configOptions.sharingurl, app.data.getFSSourceLayerItemId()),
					contentUrl = Helper.getMyContentURL(configOptions.sharingurl);

				// Clean UI
				container.find('.share, .first-save, .not-shared').addClass('hide');
				container.find('.modal-footer .success, .modal-footer .error').hide();

				if (isFirstSave)
					presentFirstSave(appUrl, contentUrl);
				else {
					var isPrivate = app.data.getAppItem().access == "private" || app.data.getAppItem().access == "shared";
					if ( isPrivate )
						presentSharing(itemUrl, appUrl, webmapUrl, function(){
							presentShared(appUrl, itemUrl, webmapUrl, /*fsUrl,*/ contentUrl);
						});
					else
						presentShared(appUrl, itemUrl, webmapUrl, /*fsUrl,*/ contentUrl);

					container.find('h3').html(i18n.swipe.share.shareTitle);
					displayShareDialog(isPrivate);
				}

				container.find('.btnClose').html(i18n.swipe.helpPopup.close);
				container.find(".modal-header .close").attr("data-dismiss", "modal");
				$(container).modal({keyboard: true});
				$('.collapse.in').collapse('hide');
			};

			// First save in from scratch mode: dialog with the admin link
			function presentFirstSave(appUrl, contentUrl)
			{
				container.find('h3').html(i18n.swipe.share.firstSaveTitle);
				var myStoriesUrl = app.isPortal ? Helper.getMyStoriesURL() : "//storymaps.arcgis.com/en/my-stories/";
				container.find('.saved-tip').html(
					i18n.swipe.share.manageStoryA1
						.replace('%LINK1%', '<a href="' + myStoriesUrl + '" target="_blank">' + i18n.swipe.share.manageStoryA1V1 + '</a>')
						.replace('%LINK2%', '<a href="http://links.esri.com/storymaps/my_stories_blog_posts" target="_blank">' + i18n.swipe.share.manageStoryA1V2 + '</a>')
				);
				container.find('.first-save').removeClass('hide');
			}

			// Sharing screen
			function presentSharing(itemUrl, appUrl, webmapUrl, successCallback)
			{
				container.find('.share .not-shared .header').html(i18n.swipe.share.sharePrivateHeader);

				// Share public
				container.find('.not-shared .btn-sharePublic').html(i18n.swipe.share.sharePrivateBtn1);
				if( app.portal && app.portal.canSharePublic !== undefined && ! app.portal.canSharePublic ) {
					container.find('.not-shared .btn-sharePublic')
						.addClass("disabled")
						.popover({
							trigger: 'hover',
							placement: 'top',
							html: true,
							content: i18n.builder.settingsHeader.settingsLogoSocialDisabled
						});
				}
				else {
					container.find('.btn-sharePublic').off('click').on('click', function() {
						share("public", successCallback);
					});
				}

				// Share with organization
				if( app.portal && app.portal.isOrganization ) {
					container.find('.not-shared .btn-shareOrga').html(i18n.swipe.share.sharePrivateBtn2);
					container.find('.btn-shareOrga').off('click').on('click', function() {
						share("account", successCallback);
					});
				}
				else
					container.find('.not-shared .btn-shareOrga').remove();

				// If user is not webmap owner (and he hasn't disabled warning)
				var map1Private = false;
 				if ( app.data.getWebMapItem().item.owner != app.portal.getPortalUser().username) {
 					var sharingStatus = null;
 					if (app.data.getWebMapItem().item.access == "account") {
 						sharingStatus = i18n.swipe.share.shareWarningWith1;
 						container.find('.not-shared .btn-sharePublic').addClass("disabled").off('click');
 					}
 					else if (app.data.getWebMapItem().item.access == "private"||app.data.getWebMapItem().item.access == "shared") {
 						sharingStatus = i18n.swipe.share.shareWarningWith2;
 						container.find('.not-shared .btn-sharePublic, .not-shared .btn-shareOrga').addClass("disabled").off('click');
 					}

 					if( sharingStatus ) {
						map1Private = true;
 						container.find('.share-warning').html(
 							i18n.swipe.share.shareWarning
 								.replace('%WITH%', sharingStatus)
 								.replace('%LINK%', webmapUrl)
 						).show();
 					}
 				}

				if (app.mode == "TWO_WEBMAPS") {
					var webmap2Url = webmapUrl.substring(0, webmapUrl.length-32)+app.data.getWebMapItem2().item.id;
					if (app.data.getWebMapItem2().item.owner != app.portal.getPortalUser().username) {
						var sharingStatus = null;

						if (app.data.getWebMapItem2().item.access == "account") {
							sharingStatus = i18n.swipe.share.shareWarningWith1;
							container.find('.not-shared .btn-sharePublic').addClass("disabled").off('click');
						}
						else
							if (app.data.getWebMapItem2().item.access == "private"||app.data.getWebMapItem2().item.access == "shared") {
								sharingStatus = i18n.swipe.share.shareWarningWith2;
								container.find('.not-shared .btn-sharePublic, .not-shared .btn-shareOrga').addClass("disabled").off('click');
							}
						if( sharingStatus && !map1Private) {
	 						container.find('.share-warning').html(
	 							i18n.swipe.share.shareWarning
	 								.replace('%WITH%', sharingStatus)
	 								.replace('%LINK%', webmap2Url)
	 						).show();
	 					}
						if( sharingStatus && map1Private ) {
	 						container.find('.share-warning').html(
	 							i18n.swipe.share.shareWarning
									.replace('%WITH%', sharingStatus)
 									.replace('%LINK%', webmapUrl)
	 							+'<br>'
								+'<br>'
								+i18n.swipe.share.shareWarning
									.replace('%WITH%', sharingStatus)
 									.replace('%LINK%', webmap2Url)
	 						).show();
	 					}

					}
				}


				container.find('.modal-footer .error').html(
					i18n.swipe.share.sharePrivateErr
					+ ' '
					+ i18n.swipe.share.shareA1.toLowerCase()
						.replace('%shareimg%', '<img src="resources/icons/builder-share-shareBtn.png" style="vertical-align: -5px;"/>')
						.replace('%link1%', itemUrl)
				);

				container.find('.not-shared .btn-learnmore').html(i18n.swipe.share.learnMore);
				container.find('.btn-learnmore').off('click').on('click', function() {
					//app.builder.openHelpPopup(4);
					window.open('https://storymaps.arcgis.com/en/app-list/swipe-spyglass/','_blank');
				});

				container.find('.not-shared .btn-preview').html(i18n.swipe.share.sharePreviewAsUser);
				container.find('.btn-preview').off('click').on('click', function() {
					window.open(appUrl,'_blank');
				});
			}

			// Alrady shared screen
			function presentShared(appUrl, itemUrl, webmapUrl, /*fsUrl,*/ contentUrl)
			{
				// Header
				container.find('.shared-dialog .header').html(
					app.data.getAppItem().access == "public" ? i18n.swipe.share.shareHeader1 : i18n.swipe.share.shareHeader2
				);

				// Link
				container.find('.share-link').html(
					'<div>'
					+ i18n.swipe.share.shareLinkHeader
					+ '<div style="margin-top: 5px;">'
					+ '<input type="text" style="height: 20px; font-size: 20px; width: 200px; text-align: center;" id="firstSavebitly1" value="' + appUrl + '" />'
					+ ' <a class="btn collapse-btn" href="' + appUrl + '" target="_blank" style="vertical-align: 4px">' + i18n.swipe.share.shareLinkOpen + '</a>'
					+ '</div>'
					+ '</div>'
				);

				var myStoriesUrl = app.isPortal ? Helper.getMyStoriesURL() : "//storymaps.arcgis.com/en/my-stories/";
				container.find('.shared-tip').html(
					i18n.swipe.share.manageStoryA1
						.replace('%LINK1%', '<a href="' + myStoriesUrl + '" target="_blank">' + i18n.swipe.share.manageStoryA1V1 + '</a>')
						.replace('%LINK2%', '<a href="http://links.esri.com/storymaps/my_stories_blog_posts" target="_blank">' + i18n.swipe.share.manageStoryA1V2 + '</a>')
				);

				if (APPCFG.HEADER_SOCIAL && APPCFG.HEADER_SOCIAL.bitly && APPCFG.HEADER_SOCIAL.bitly.enable) {
					getBitLy(appUrl, '#firstSavebitly1');
					getBitLy(appUrl + '&edit', '#firstSavebitly3');
				}
				else
					setTimeout(function(){ $("#firstSavebitly1").select(); }, 100);
			}

			function displayShareDialog(displayNotShared)
			{
				container.find('.share').removeClass('hide');
				container.find('.not-shared').toggleClass('hide', ! displayNotShared);
				container.find('.shared-dialog').toggleClass('hide', displayNotShared);
			}

			function share(type, successCallback)
			{
				sharePrepare();
				app.builder.shareAppAndWebmap(type, function(success){
					if (success) {
						successCallback();
						shareSuccess();
					}
					else
						shareError();
				});
			}

			function sharePrepare()
			{
				container.find('.modal-footer .footer-status').hide();
				container.find('.share .btn, .btnClose').attr("disabled", "disabled");
				container.find('.modal-footer .success').html(i18n.swipe.share.sharePrivateProgress);
				container.find('.modal-footer .success').show();
				container.find('.modal-footer .error').hide();
			}

			function shareSuccess()
			{
				container.find('.modal-footer .success').html(i18n.swipe.share.sharePrivateOk);
				setTimeout(function(){
					container.find('.modal-footer .success').hide();
					displayShareDialog(false);
					container.find('.share .btn, .btnClose').removeAttr("disabled");
					$("#firstSavebitly1").select();
				}, 1500);
			}

			function shareError()
			{
				container.find('.modal-footer .success').hide();
				container.find('.modal-footer .error').show();
				container.find('.share .btn, .btnClose').removeAttr("disabled");
			}

			function getBitLy(targetUrl, nodeSelector)
			{
				var bitlyUrls = [
					"http://api.bitly.com/v3/shorten?callback=?",
					"https://api-ssl.bitly.com/v3/shorten?callback=?"
				];
				var bitlyUrl = location.protocol == 'http:' ? bitlyUrls[0] : bitlyUrls[1];

				$.getJSON(
					bitlyUrl,
					{
						"format": "json",
						"apiKey": APPCFG.HEADER_SOCIAL.bitly.key,
						"login": APPCFG.HEADER_SOCIAL.bitly.login,
						"longUrl": targetUrl
					},
					function(response)
					{
						if( ! response || ! response || ! response.data.url )
							return;

						container.find(nodeSelector).val(response.data.url);

						if( nodeSelector == "#firstSavebitly1" )
							$("#firstSavebitly1").select();
						else if( nodeSelector == "#firstSavebitly2" )
							$("#firstSavebitly2").select();
					}
				);
			}
		};
	}
);

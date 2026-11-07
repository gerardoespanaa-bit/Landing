'use strict';
// Only the owner's directly installed Google Ads destination remains active.
window.LANDING_MEASUREMENT_CONFIG=Object.freeze({
 enabled:true,
 googleAdsId:'AW-18527900519',
 // Add only verified Google Ads campaign IDs before an approved launch.
 // Empty until the owner's Ads account and campaign exist; never accept any number.
 adsCampaignIds:Object.freeze([])
});


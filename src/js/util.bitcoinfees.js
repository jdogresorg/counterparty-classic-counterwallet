var CWBitcoinFees = (function() {
  var exports = {};

  var DEFAULT_FEE_MAX_DELAY_BLOCKS = 2;

  var feesCache = null
  // provide at least something for fallback fees
  //   make it obvious that there is no predictability here
  var defaultFees = [
    {
      name: "low_priority",
      offset: 0,
      fee: 101,
      minDelay: 1,
      maxDelay: 9999
    },
    {
      name: "optimal",
      offset: 1,
      fee: 201,
      minDelay: 1,
      maxDelay: 1000
    }
  ]

  exports.getFees = function(cb) {
    getCache(cb)
  }

  exports.getFeeByOffset = function(offset, cb) {
    getCache(function() {
      if (feesCache[offset] != null) {
        cb(feesCache[offset]);
        return
      }
      cb(lastOrDefaultFee())
      return
    })
  }

  exports.getFeeByName = function(name, cb) {
    getCache(function(fees) {
      for (var i=0;i<fees.length;i++){
	    if (fees[i].name == name){
		    cb(fees[i])
			return
		}
      }
      
      cb(null)
      return
    })
  }

  exports.getFeesByName = function(cb) {
    getCache(function(fees) {
      var feesByName = {}
      for (var i=0;i<fees.length;i++){
          feesByName[fees[i].name] = fees[i]
      }
      
      cb(feesByName)
      return
    })
  }
  
  exports.defaultFee = function(cb) {
    getCache(function() {
      for (var i = 0; i < feesCache.length; i++) {
        if (feesCache[i].minDelay <= 0 && feesCache[i].maxDelay <= DEFAULT_FEE_MAX_DELAY_BLOCKS) {
          cb(feesCache[i])
          return
        }
      }
      cb(lastOrDefaultFee())
      return
    })
  }

  function lastOrDefaultFee() {
    if (feesCache.length) {
      return feesCache[feesCache.length - 1]
    }
    return defaultFees[0]
  }

  function getCache(cb) {
    if (feesCache === null) {
      refreshCache(cb)
      return
    }

    cb(feesCache)
    return
  }

  function refreshCache(cb) {
    $.ajax({
      method: "GET",
      url: "https://classic.tokenscan.io/api/network",
      dataType: 'json',
      success: function(apiResponse) {
        buildFeesFromResponse(apiResponse);
        if (typeof cb == 'function') {
          cb(feesCache)
          return
        }
      },
      error: function(jqxhr, textSatus, errorThrown) {
        $.jqlog.warn('bitcoinfees quote failed: '+textSatus+' '+errorThrown);
        if (typeof cb == 'function') {
          if (feesCache == null) {
            feesCache = defaultFees
          }
          cb(feesCache)
        }
        return
      }
    });
  }

  function buildFeesFromResponse(apiResponse) {
    var rawFees = apiResponse.fee_info
    // $.jqlog.debug('buildFeesFromResponse rawFees '+JSON.stringify(rawFees,null,2));
    feesCache = []

    var lowPriorityFee = rawFees.low_priority
    var optimalFee = rawFees.optimal

    var lowPriorityEntry = {
      name: "low_priority",
      offset: 0,
      fee: lowPriorityFee,
      minDelay: 1,
      maxDelay: 9999
    }
    var optimalEntry = {
      name: "optimal",
      offset: 1,
      fee: optimalFee,
      minDelay: 1,
      maxDelay: 1000
    }

    feesCache.push(lowPriorityEntry)
    feesCache.push(optimalEntry)

    // $.jqlog.debug('buildFeesFromResponse feesCache '+JSON.stringify(feesCache));
  }

  // init
  setInterval(refreshCache, 300000); // refresh once every 5 minutes
  setTimeout(refreshCache, 1000); // first time 1 sec. after load

  return exports;
})();

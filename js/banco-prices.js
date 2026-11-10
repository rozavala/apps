/* ================================================================
   BANCO FAMILIA — banco-prices.js
   The "What did $10 buy?" card: a few well-known prices, then and now.
   Plain facts only: every figure needs a cited source here, and a
   figure that can't be sourced is left out. Add a point by adding an
   item to POINTS with its source; the card works out how many $10 buys.

   First-class stamp (one ounce letter), in cents.
   Source: United States Postal Service, Postal History, "Rates for
   Domestic Letters Since 1863" (published by the USPS Historian)
   https://about.usps.com/who/profile/history/domestic-letter-rates-since-1863.htm
   The rate in force in each year shown (effective date of that rate):
     1980  15 cents  (May 29, 1978)
     1990  25 cents  (April 3, 1988)
     2000  33 cents  (January 10, 1999)
     2010  44 cents  (May 11, 2009)
     2025  78 cents  (July 13, 2025)
   Review note: these were read from a search summary of the USPS table,
   not from the page itself; spot-check them against the URL above.
   ================================================================ */
var BancoPrices = (function () {
  'use strict';

  var POINTS = [
    {
      id: 'stamp', name: 'a first-class stamp', plural: 'first-class stamps',
      source: 'U.S. Postal Service, Rates for Domestic Letters Since 1863 (about.usps.com)',
      rows: [
        { year: 1980, cents: 15 },
        { year: 1990, cents: 25 },
        { year: 2000, cents: 33 },
        { year: 2010, cents: 44 },
        { year: 2025, cents: 78 }
      ]
    }
  ];

  // How many whole items $10 buys at a price in cents.
  function countFor(cents) { return Math.floor(1000 / cents); }

  return { POINTS: POINTS, countFor: countFor };
})();

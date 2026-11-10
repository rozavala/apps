/* ================================================================
   BANCO FAMILIA — banco-prices.js
   The "What did $10 buy?" card: a few well-known prices, then and now.
   Plain facts only: every figure needs a cited source here, and a
   figure that can't be sourced is left out. Add a point by adding an
   item to POINTS with its source; the card works out how many $10 buys.

   First-class stamp (one ounce letter), in cents.
   Source: United States Postal Service, Postal History, "Rates for
   Domestic Letters Since 1863" (USPS Historian, page footer dated
   August 2026), read directly from the page:
   https://about.usps.com/who/profile/history/domestic-letter-rates-since-1863.htm
   The rows used (effective date, cents), each the rate in force in the
   year shown:
     1980  May 29, 1978    15 cents
     1990  April 3, 1988   25 cents
     2000  January 10, 1999  33 cents
     2010  May 11, 2009    44 cents
     2026  July 12, 2026   82 cents
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
        { year: 2026, cents: 82 }
      ]
    }
  ];

  // How many whole items $10 buys at a price in cents.
  function countFor(cents) { return Math.floor(1000 / cents); }

  return { POINTS: POINTS, countFor: countFor };
})();

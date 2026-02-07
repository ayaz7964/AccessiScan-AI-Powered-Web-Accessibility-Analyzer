"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * Professional Progress Circle Component
 * @param {number} percentage - The progress value (0 to 100)
 * @param {number} size - Total width/height of the SVG in pixels
 * @param {number} strokeWidth - Thickness of the progress line
 * @param {string} color - Hex or Tailwind color for the progress bar
 */
const ProgressCircle = ({
  percentage = 0,
  size = 200,
  strokeWidth = 16,
  color = "#3b82f6"
}) => {
  // Calculate SVG math
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate how much of the circle to "hide"
  // If percentage is 90, we show 90% of the circumference
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-800"
        />

        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          {Math.round(percentage)}%
        </motion.span>
      </div>
    </div>
  );
};

// export default ProgressCircle;


import { useState } from "react";
// import ProgressCircle from "./ProgressCircle";
import puppeteer from "puppeteer";
import axe from "axe-core";

export default function Page() {
  const [val, setVal] = useState(10);
  const [isOpen, setOpen] = useState(false);
  const [url , setUrl] = useState()
  const [vol , setVilation] = useState()
//  async function scanWebsite(url) {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();

//   await page.goto(url, { waitUntil: "networkidle2" });

//   // Inject axe-core into page
//   await page.addScriptTag({ content: axe.source });

//   const results = await page.evaluate(async () => {
//     return await window.axe.run();
//   });

//   await browser.close();
//   return results.violations;
// }

  // 520380 , 3A025B bg-[#220135] 
  return (


    <div className="p-20 space-y-4 bg-gray-200 w-full min-h-screen  flex justify-center ">

      {/* <input 
        type="range" 
        onChange={(e) => setVal(e.target.value)} 
        className="w-full" 
      /> */}

      {/* <div className="w-[70%] bg-[#3A025B]   rounded-[30px] shadow-lg p-10"> */}
      {/* <input type="text" className="w-20 "/> */}


      {/* </div> */}

      <div className="w-[70%] text-center flex justify-start items-center   flex-col ">
        <h1 className="text-5xl font-bold text-center text-black ">Website Accessbility Checker</h1>
        <p className="w-[55%] ">Empower your development team to build inclusive digital experiences.
          Enter a URL to run a deep, automated audit against international accessibility standards.</p>

        <div className="w-[90%] bg-white h-40 m-10 rounded-[10px] flex   ">

          <input type="text" className="w-[70%] border-2  m-10 rounded-[20px] h-10 p-5 "
           value = {url} placeholder="Enter your URL https//www.example.com" onChange={(e)=>setUrl(e.target.value)} />
          <button className=" h-10 mt-10 mr-10  w-32  hover:bg-blue-900  rounded-[10px] text-white bg-blue-600 text-center "
           onClick={() => { setOpen(true)  }}>Start Test </button>
        </div>
        {
          isOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center ">
              <div className="bg-white p-6 rounded-lg w-150">
                <div className="flex justify-center mb-4 items-center">
                  <ProgressCircle percentage={val} color="#10b981" /></div>
                <p className="text-xl font-bold text-gray-600 mb-4">
                  Scanning accessbility issues...
                </p>
                <p className="w-[100%] p-10 text-center">Evaluting page structure, interactive elements, and color paletters against WCAG 2.1 AA guidelines.</p>

                <div className="flex justify-center ">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 border rounded"
                  >
                   X Cancel scan
                  </button>
                  
                </div>
              </div>
              
            </div>
          )
        }

        {/* <div class="relative flex items-center">
   
    <svg class="absolute left-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>

    <input type="text" placeholder="Search..." class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

 
    <svg class="absolute right-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg> */}
        {/* </div> */}


      </div>



      {/* <div className="flex  items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-4xl font-bold text-white mb-6"
      >
        
      </motion.div> */}
      {/* </div> */}
         {/* {vol} */}
    </div>

 
  );
}
"use client"
import AuthorityMember from "./AuthorityMember";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import member1 from "@assets/member1_1759739467950.png";
import member2 from "@assets/member2_1759739467949.png";
import member3 from "@assets/member3_1759739467949.png";
import member4 from "@assets/member4_1759739467948.png";
import member5 from "@assets/member5_1759739467948.png";
import member6 from "@assets/member6_1759739467947.png";
import member7 from "@assets/member7_1759739467947.png";

const authorities = [
  {
    name: "श्री देवेंद्र फडणवीस",
    designation: "Hon. Chief Minister of Maharashtra Government",
    image: "member1_1759739467950.png",
  },
  {
    name: "श्री एकनाथ शिंदे",
    designation: "Hon. Deputy Chief Minister of Maharashtra Government",
    image: "member2_1759739467949.png",
  },
  {
    name: "श्री अजित पवार",
    designation: "Hon. Deputy Chief Minister of Maharashtra Government",
    image: "member3_1759739467949.png",
  },
  {
    name: "मा. ना. श्रीमती. पंकजताई मुंडे",
    designation: "Hon. Minister for Animal Husbandry, Environment & Climate Change",
    image: "member4_1759739467948.png",
  },
  {
    name: "डॉ. रामस्वामी एन.",
    designation: "Hon. Additional Chief Secretary, Animal Husbandry And Dairy Development",
    image: "member5_1759739467948.png",
  },
  {
    name: "श्री प्रवीणकुमार देवरे",
    designation: "Hon. Commissioner Department of Animal Husbandry Maharashtra Government",
    image: "member6_1759739467947.png",
  },
  {
    name: "डॉ. प्रशांत भट्ट",
    designation: "Hon. Deputy Commissioner, Animal Husbandry & Dairy and Member Secretary, Maharashtra Bovine Breeding Regulatory Authority, Maharashtra Government",
    image: "member7_1759739467947.png",
  },
];

export default function AuthoritiesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-12 sm:py-16 bg-muted/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2
            className="font-display font-semibold text-2xl sm:text-3xl mb-3"
            data-testid="text-authorities-title"
          >
            Programme Authorities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet the leadership team dedicated to implementing and managing the
            VMDDP scheme
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {authorities.map((authority, index) => (
            <motion.div
              key={authority.name}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AuthorityMember
                name={authority.name}
                designation={authority.designation}
                image={authority.image}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

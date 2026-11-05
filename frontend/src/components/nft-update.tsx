/* eslint-disable */
import React from 'react'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger } from './animated-modal'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion } from 'framer-motion'

type AnimatedModalDemoProps = {
  selectedNft: any
}

export function AnimatedModalDemo({ selectedNft }: AnimatedModalDemoProps) {
  return (
    <div className="flex items-center justify-center">
      <Modal>
        <ModalBody>
          <ModalContent>
            <h4 className="text-lg md:text-2xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8">
              name
            </h4>
            <div className="flex justify-center items-center">
              <motion.div
                key={'image'}
                style={{
                  rotate: Math.random() * 20 - 10,
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 0,
                  zIndex: 100,
                }}
                whileTap={{
                  scale: 1.1,
                  rotate: 0,
                  zIndex: 100,
                }}
                className="rounded-xl -mr-4 mt-4 p-1 bg-white dark:bg-neutral-800 dark:border-neutral-700 border border-neutral-100 flex-shrink-0 overflow-hidden"
              >
                <Image
                  src=""
                  alt={selectedNft.name}
                  width="500"
                  height="500"
                  className="rounded-lg h-20 w-20 md:h-40 md:w-40 object-cover flex-shrink-0"
                />
              </motion.div>
            </div>
            <div className="py-10 flex flex-wrap gap-x-4 gap-y-6 items-start justify-start max-w-sm mx-auto">
              <div className="flex items-center justify-center">
                <span className="text-neutral-700 dark:text-neutral-300 text-sm">Price: 0 SOL</span>
              </div>
            </div>
          </ModalContent>
          <ModalFooter className="gap-4">
            <Button
              variant="secondary"
              className="w-28 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="w-28 bg-black text-white dark:bg-white dark:text-black border border-black"
            >
              Book Now
            </Button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </div>
  )
}

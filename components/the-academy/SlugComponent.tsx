"use client"

import { BLOCKS, MARKS } from "@contentful/rich-text-types"
import { Document } from "@contentful/rich-text-types"
import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
import { MesoProps } from "@/lib/types"
import { useState } from "react"
import Image from "next/image"

const TABS = ["Conceitos Teóricos", "Exercícios", "Correções Técnicas"]

export const TheAcademySlugComponent = ({ meso }: { meso: MesoProps }) => {
  const [tab, setTab] = useState(0)
  const { content, exercisesCollection, videosCollection } = meso

  return (
    <>
      <Tabs tabs={TABS} onChange={setTab} tab={tab} />

      <div className="md:px-4 lg:px-8">
        {tab === 0 && (
          <div>
            <ContentSection json={content.json} />
          </div>
        )}

        {tab === 1 && (
          <div className="grid md:grid-cols-2 gap-6">
            {exercisesCollection.items.map((a, i) => (
              <ExercisesSection key={i} {...a} />
            ))}
          </div>
        )}

        {tab === 2 && (
          <div className="grid md:grid-cols-2 gap-6">
            {videosCollection.items.map((a, i) => (
              <ExercisesSection key={i} {...a} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const Tabs = ({
  tabs,
  onChange,
  tab,
}: {
  onChange: (tab: number) => void
  tab: number
  tabs: string[]
}) => (
  <div className="mb-8 flex gap-4 p-2 rounded-lg shadow-md bg-projectGray">
    {tabs.map((t, i) => (
      <button
        key={t}
        onClick={() => onChange(i)}
        className={`flex-1 py-2 px-4 rounded-md focus:outline-none focus:shadow-outline-blue transition-all duration-300 ${
          tab === i ? "bg-projectGreen text-white font-bold" : ""
        }`}
      >
        {t}
      </button>
    ))}
  </div>
)

const ContentSection = ({ json }: { json: Document }) => {
  const options = {
    renderMark: {
      [MARKS.BOLD]: (text: string) => <span className="font-bold">{text}</span>,
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node: any, children: any) => (
        <p className="mb-1">{children}</p>
      ),
      [BLOCKS.HEADING_1]: (node: any, children: any) => (
        <h1 className="text-2xl font-bold mb-2">{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (node: any, children: any) => (
        <h1 className="text-xl font-bold mb-2 mt-6">{children}</h1>
      ),
      [BLOCKS.HEADING_3]: (node: any, children: any) => (
        <h1 className="text-lg font-bold mb-2 mt-4">{children}</h1>
      ),
      [BLOCKS.UL_LIST]: (node: any, children: any) => (
        <ul className="mt-2">{children}</ul>
      ),
      [BLOCKS.OL_LIST]: (node: any, children: any) => <ol>{children}</ol>,
      [BLOCKS.LIST_ITEM]: (node: any, children: any) => (
        <li className="flex gap-2">- {children}</li>
      ),
    },
  }

  return (
    <div className="border border-gray-200 rounded-md pb-4 px-6 mb-6">
      {/* @ts-expect-error options is correct */}
      {documentToReactComponents(json, options)}
    </div>
  )
}

const ExercisesSection = ({
  url,
  title,
  width,
  height,
}: {
  url: string
  title: string
  width: number
  height: number
}) => {
  const [open, setOpen] = useState(false)

  const isVideo = url.includes("videos.ctfassets.net")

  return (
    <>
      <div className="border border-gray-200 rounded-md p-4 mb-6">
        <div className="relative">
          {isVideo ? (
            <video controls muted src={url} />
          ) : (
            <button onClick={() => setOpen(!open)}>
              <Image src={url} alt={title} width={width} height={height} />
            </button>
          )}
        </div>

        <h2 className="text-lg font-bold mt-2 text-center">{title}</h2>
      </div>

      {open && (
        <div
          role="dialog"
          className={`fixed top-0 left-0 z-50 w-screen h-screen flex items-center justify-center p-6 bg-gray-100/90 backdrop-blur-sm transition-all duration-300`}
        >
          <div className="flex flex-col p-6 rounded-md bg-white shadow-md">
            <Image src={url} alt={title} width={width} height={height} />

            <div className="flex items-center justify-around mt-4">
              <h2 className="text-lg font-bold">{title}</h2>
              <button
                className="bg-btn-background rounded-md p-2"
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import React from "react";
import { Page, PageProps } from 'react-pdf'

export default function PdfPage(args: PageProps) {
  return (<Page {...args} />)
}

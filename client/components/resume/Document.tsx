import React from "react";
import { Document, DocumentProps } from 'react-pdf'

export default function PdfDocument(args: DocumentProps) {
  return (<Document {...args} />)
}

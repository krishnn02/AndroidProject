import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  PageBreak,
} from 'docx';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { Report, ReportSection, Budget } from '../models/index.js';
import { createError } from '../middleware/error.js';

function getImageType(url: string): 'png' | 'jpg' | 'gif' | 'bmp' {
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'png';
  if (lower.includes('.gif')) return 'gif';
  if (lower.includes('.bmp')) return 'bmp';
  return 'jpg'; // Default to jpg
}

/**
 * Optimizes Cloudinary URLs for document generation.
 * Shrinks dimensions, converts to native JPEG, and applies high/eco-compression.
 */
function optimizeCloudinaryUrl(url: string, type: 'logo' | 'section'): string {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return url;
  }

  const uploadMarker = '/image/upload/';
  const markerIndex = url.indexOf(uploadMarker);
  if (markerIndex === -1) {
    return url;
  }

  // logos: max 200px width; section images: max 800px width. Both eco quality, native JPEG.
  const transformation = type === 'logo'
    ? 'w_200,c_limit,q_70,f_jpg/'
    : 'w_800,c_limit,q_70,f_jpg/';

  const insertIndex = markerIndex + uploadMarker.length;
  return url.slice(0, insertIndex) + transformation + url.slice(insertIndex);
}

async function downloadImageToBuffer(url: string): Promise<Buffer | null> {
  try {
    if (!url) return null;
    
    // If it's a local static upload
    if (url.startsWith('/') || url.includes('/uploads/')) {
      const cleanUrl = url.split('?')[0]; // Strip queries if any
      const uploadsIndex = cleanUrl.indexOf('/uploads/');
      const relativePath = uploadsIndex !== -1 ? cleanUrl.slice(uploadsIndex) : cleanUrl;
      
      // Resolve absolute paths
      const absoluteUploadsDir = path.resolve(process.cwd(), 'uploads');
      const resolvedPath = path.resolve(
        process.cwd(), 
        relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
      );
      
      // Ensure the resolved path resides strictly inside the uploads directory to prevent LFI path traversal
      if (!resolvedPath.startsWith(absoluteUploadsDir)) {
        console.error(`[DOCX] Security Warning: Directory traversal blocked! Path: ${resolvedPath}`);
        return null;
      }
      
      return await fs.readFile(resolvedPath);
    }
    
    // If it's a remote URL (Cloudinary, etc.)
    const optimizedUrl = optimizeCloudinaryUrl(url, url.includes('/logos/') ? 'logo' : 'section');
    const response = await axios.get(optimizedUrl, { responseType: 'arraybuffer', timeout: 8000 });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`[DOCX] Failed to fetch image from: ${url}`, error);
    return null;
  }
}

class DocxService {
  /**
   * Generate Microsoft Word .docx report
   */
  async generateDocx(reportId: string, baseUrl?: string): Promise<string> {
    const report = await Report.findById(reportId)
      .populate('event')
      .populate('createdBy', 'name email department')
      .populate('template');

    if (!report) throw createError(404, 'Report not found');

    const sections = await ReportSection.find({ report: reportId })
      .populate('images')
      .sort({ sortOrder: 1 });

    const budgets = await Budget.find({ report: reportId });
    const creator = report.createdBy as any;

    // Prepare container for document elements
    const docChildren: any[] = [];

    const event = report.event as any;
    const templateName = (report.template as any)?.name || event?.themeType || 'default';
    let theme = { primary: '1E3A8A', secondary: '2E2E2E', background: 'F5F5F5', highlight: 'E2E8F0' };

    if (templateName.toLowerCase().includes('aqua')) {
      theme = { primary: '00B4D8', secondary: '48CAE4', background: 'E0F7FA', highlight: 'B2EBF2' };
    } else if (templateName.toLowerCase().includes('cultural')) {
      theme = { primary: '800020', secondary: '8B5E3C', background: 'FFF8E7', highlight: 'F5DEB3' };
    } else if (templateName.toLowerCase().includes('seminar')) {
      theme = { primary: '1D3557', secondary: '457B9D', background: 'F8F9FA', highlight: 'E9ECEF' };
    } else if (templateName.toLowerCase().includes('technical')) {
      theme = { primary: '0B132B', secondary: '3A86FF', background: 'F1F5F9', highlight: 'E2E8F0' };
    } else if (templateName.toLowerCase().includes('sustainable')) {
      theme = { primary: theme.primary, secondary: '2E2E2E', background: theme.background, highlight: 'C8E6C9' };
    }

    // ==========================================
    // 1. COVER PAGE LOGOS
    // ==========================================
    const logos = report.frontPage?.logos || [];
    
    // Top Logos (all logos except the last one which is main)
    if (logos.length > 1) {
      const topLogos = logos.slice(0, logos.length - 1);
      const cells: TableCell[] = [];

      for (const logoUrl of topLogos) {
        const buffer = await downloadImageToBuffer(logoUrl);
        if (buffer) {
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      data: buffer,
                      transformation: { width: 50, height: 50 },
                      type: getImageType(logoUrl),
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            })
          );
        }
      }

      if (cells.length > 0) {
        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: cells })],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          })
        );
        docChildren.push(new Paragraph({ text: '' })); // Spacing
      }
    }

    // ==========================================
    // 2. Main Event Logo (between header and text)
    // ==========================================
    if (logos.length > 0) {
      const mainLogoUrl = logos[logos.length - 1];
      const buffer = await downloadImageToBuffer(mainLogoUrl);
      if (buffer) {
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 300 },
            children: [
              new ImageRun({
                data: buffer,
                transformation: { width: 140, height: 110 },
                type: getImageType(mainLogoUrl),
              }),
            ],
          })
        );
      }
    }

    // ==========================================
    // 3. COVER PAGE TEXTS
    // ==========================================
    if (report.frontPage?.institutionName) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: report.frontPage.institutionName.toUpperCase(),
              bold: true,
              size: 28, // 14pt
              color: theme.primary, // Emerald Green
              font: 'Inter',
            }),
          ],
        })
      );
    }

    if (report.frontPage?.departmentName) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
          children: [
            new TextRun({
              text: report.frontPage.departmentName.toUpperCase(),
              bold: true,
              size: 20, // 10pt
              color: theme.secondary, // Dark Text
              font: 'Inter',
            }),
          ],
        })
      );
    }

    // Event Title & Subtitle
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: report.frontPage?.eventTitle || 'Event Report',
            bold: true,
            size: 36, // 18pt
            color: theme.secondary, // Forest Green
            font: 'Inter',
          }),
        ],
      })
    );

    if (report.frontPage?.eventSubtitle) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
          children: [
            new TextRun({
              text: report.frontPage.eventSubtitle,
              italics: true,
              size: 22, // 11pt
              color: theme.secondary, // Nature Green
              font: 'Inter',
            }),
          ],
        })
      );
    }

    // ==========================================
    // 3. COVER PAGE DETAILS TABLE
    // ==========================================
    const details = report.frontPage?.eventDetails || [];
    if (details.length > 0) {
      const rows: TableRow[] = details.map(
        (detail) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                shading: { fill: theme.background }, // Light Mint
                children: [
                  new Paragraph({
                    spacing: { before: 120, after: 120 },
                    children: [
                      new TextRun({
                        text: detail.key,
                        bold: true,
                        size: 19, // 9.5pt
                        color: theme.primary, // Emerald Green
                        font: 'Inter',
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: theme.highlight }, // Fresh Green
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: theme.highlight },
                  left: { style: BorderStyle.SINGLE, size: 4, color: theme.highlight },
                  right: { style: BorderStyle.SINGLE, size: 4, color: theme.highlight },
                },
              }),
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    spacing: { before: 120, after: 120 },
                    children: [
                      new TextRun({
                        text: detail.value || 'N/A',
                        size: 19, // 9.5pt
                        color: theme.secondary,
                        font: 'Inter',
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: theme.highlight },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: theme.highlight },
                  left: { style: BorderStyle.SINGLE, size: 4, color: theme.highlight },
                  right: { style: BorderStyle.SINGLE, size: 4, color: theme.highlight },
                },
              }),
            ],
          })
      );

      docChildren.push(
        new Table({
          width: { size: 90, type: WidthType.PERCENTAGE },
          rows,
          alignment: AlignmentType.CENTER,
        })
      );
    }

    // Page Break after Cover Page
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // ==========================================
    // 4. CONTENT SECTIONS
    // ==========================================
    const filteredSections = sections.filter((section) => {
      const hasText = section.content?.paragraphs?.some((p: string) => p.trim().length > 0) ||
                      section.content?.bullets?.some((b: string) => b.trim().length > 0) ||
                      (section.content?.richText && section.content.richText.trim().length > 0);
      const hasImages = (section as any).images && (section as any).images.length > 0;
      return hasText || hasImages;
    });

    for (const section of filteredSections) {
      if (section.type === 'BUDGET' || section.type === 'GALLERY') continue;

      // Section Heading
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
          children: [
            new TextRun({
              text: section.heading,
              bold: true,
              size: 26, // 13pt
              color: theme.secondary, // Forest Green
              font: 'Inter',
            }),
          ],
        })
      );

      // Section content (paragraphs)
      if (section.content?.paragraphs) {
        for (const pText of section.content.paragraphs) {
          docChildren.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({
                  text: pText,
                  size: 20, // 10pt
                  color: theme.secondary,
                  font: 'Inter',
                }),
              ],
            })
          );
        }
      }

      // Section content (bullets)
      if (section.content?.bullets) {
        for (const bulletText of section.content.bullets) {
          docChildren.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: bulletText,
                  size: 20, // 10pt
                  color: theme.secondary,
                  font: 'Inter',
                }),
              ],
            })
          );
        }
      }

      // Section Images Layout
      const secImages = (section as any).images || [];
      if (secImages.length > 0) {
        docChildren.push(new Paragraph({ text: '' })); // Spacing

        if (secImages.length === 1) {
          const img = secImages[0];
          const buffer = await downloadImageToBuffer(img.url);
          if (buffer) {
            docChildren.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: buffer,
                    transformation: { width: 440, height: 280 },
                    type: getImageType(img.url),
                  }),
                ],
              })
            );
            if (img.caption) {
              docChildren.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 60, after: 120 },
                  children: [
                    new TextRun({
                      text: img.caption,
                      italics: true,
                      size: 16, // 8pt
                      color: theme.secondary,
                      font: 'Inter',
                    }),
                  ],
                })
              );
            }
          }
        } else {
          // Arrange side-by-side or in grid
          const rows: TableRow[] = [];
          for (let i = 0; i < secImages.length; i += 2) {
            const cells: TableCell[] = [];
            
            // Image 1 in Row
            const imgA = secImages[i];
            const bufferA = await downloadImageToBuffer(imgA.url);
            
            // Image 2 in Row (optional)
            const imgB = i + 1 < secImages.length ? secImages[i + 1] : null;
            const bufferB = imgB ? await downloadImageToBuffer(imgB.url) : null;

            if (bufferA) {
              cells.push(
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          data: bufferA,
                          transformation: { width: 220, height: 140 },
                          type: getImageType(imgA.url),
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 60, after: 60 },
                      children: [
                        new TextRun({
                          text: imgA.caption || '',
                          italics: true,
                          size: 15,
                          color: theme.secondary,
                          font: 'Inter',
                        }),
                      ],
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                })
              );
            }

            if (bufferB) {
              cells.push(
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          data: bufferB,
                          transformation: { width: 220, height: 140 },
                          type: getImageType(imgB.url),
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 60, after: 60 },
                      children: [
                        new TextRun({
                          text: imgB.caption || '',
                          italics: true,
                          size: 15,
                          color: theme.secondary,
                          font: 'Inter',
                        }),
                      ],
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                })
              );
            } else if (bufferA) {
              // Add blank second column cell to balance row
              cells.push(
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: '' })],
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                })
              );
            }

            if (cells.length > 0) {
              rows.push(new TableRow({ children: cells }));
            }
          }

          if (rows.length > 0) {
            docChildren.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows,
                alignment: AlignmentType.CENTER,
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
              })
            );
          }
        }
      }
    }

    // ==========================================
    // 5. BUDGET SUMMARY TABLE
    // ==========================================
    if (budgets.length > 0) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 150 },
          children: [
            new TextRun({
              text: 'Budget Summary',
              bold: true,
              size: 26,
              color: theme.secondary,
              font: 'Inter',
            }),
          ],
        })
      );

      const tableRows: TableRow[] = [];

      // Table Header
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: theme.secondary },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '#', bold: true, color: 'FFFFFF', size: 18, font: 'Inter' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { fill: theme.secondary },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Item Description', bold: true, color: 'FFFFFF', size: 18, font: 'Inter' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              shading: { fill: theme.secondary },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Category', bold: true, color: 'FFFFFF', size: 18, font: 'Inter' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: theme.secondary },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Qty', bold: true, color: 'FFFFFF', size: 18, font: 'Inter' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              shading: { fill: theme.secondary },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: 'Unit Cost', bold: true, color: 'FFFFFF', size: 18, font: 'Inter' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              shading: { fill: theme.secondary },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: 'Total', bold: true, color: 'FFFFFF', size: 18, font: 'Inter' })],
                }),
              ],
            }),
          ],
        })
      );

      // Table Data
      let grandTotal = 0;
      budgets.forEach((budget, index) => {
        grandTotal += budget.totalCost;
        const shadingFill = index % 2 === 0 ? 'FFFFFF' : 'F5F5F5'; // zebra striping
        
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: shadingFill },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: (index + 1).toString(), size: 18, font: 'Inter' })],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: shadingFill },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: budget.item, size: 18, font: 'Inter' })],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: shadingFill },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: budget.category || 'General', size: 18, font: 'Inter' })],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: shadingFill },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: budget.quantity.toString(), size: 18, font: 'Inter' })],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: shadingFill },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: `Rs. ${budget.unitCost.toFixed(2)}`, size: 18, font: 'Inter' })],
                  }),
                ],
              }),
              new TableCell({
                shading: { fill: shadingFill },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: `Rs. ${budget.totalCost.toFixed(2)}`, size: 18, font: 'Inter' })],
                  }),
                ],
              }),
            ],
          })
        );
      });

      // Grand Total Row
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 5,
              shading: { fill: theme.background },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: 'Grand Total: ', bold: true, color: theme.primary, size: 18, font: 'Inter' })],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: theme.background },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: `Rs. ${grandTotal.toFixed(2)}`, bold: true, color: theme.primary, size: 18, font: 'Inter' })],
                }),
              ],
            }),
          ],
        })
      );

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      );
    }

    // ==========================================
    // 6. SIGNATURE SECTION
    // ==========================================
    docChildren.push(new Paragraph({ text: '', spacing: { before: 400, after: 200 } }));

    const sigCells = [
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ text: '', spacing: { before: 400 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '_____________________', color: '64748B', font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60 },
            children: [new TextRun({ text: creator?.name || 'N/A', bold: true, size: 18, font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Report Prepared By\n${creator?.department || 'N/A'}`,
                size: 15,
                color: '64748B',
                font: 'Arial',
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
      }),
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ text: '', spacing: { before: 400 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '_____________________', color: '64748B', font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60 },
            children: [new TextRun({ text: 'Coordinator', bold: true, size: 18, font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Event Coordinator\nOrganizing Team',
                size: 15,
                color: '64748B',
                font: 'Arial',
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
      }),
      new TableCell({
        width: { size: 34, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ text: '', spacing: { before: 400 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '_____________________', color: '64748B', font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60 },
            children: [new TextRun({ text: 'Head of Department', bold: true, size: 18, font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Department Head\nApproval Authority',
                size: 15,
                color: '64748B',
                font: 'Arial',
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
      }),
    ];

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: sigCells })],
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
      })
    );

    // ==========================================
    // 7. COMPILING THE DOCX DOCUMENT
    // ==========================================
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    // Save locally
    const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const filename = `report-${reportId}.docx`;
    const filePath = path.join(reportsDir, filename);
    
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);

    const docxUrl = `${baseUrl || ''}/api/reports/${reportId}/download/docx`;

    // Save URL to report
    await Report.updateOne({ _id: report._id }, { $set: { docxUrl } });

    console.log(`[DOCX] Serving DOCX locally via API: ${docxUrl}`);
    return docxUrl;
  }
}

export const docxService = new DocxService();

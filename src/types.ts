/** Options accepted by every extraction entry point. */
export interface ExtractOptions {
    /**
     * Keep line breaks in the extracted text. Defaults to `false`, which
     * collapses every break into a space.
     */
    preserveLineBreaks?: boolean;

    /**
     * Collapse single line breaks into spaces but keep consecutive ones.
     * Implies {@link ExtractOptions.preserveLineBreaks}. Defaults to `false`.
     */
    preserveOnlyMultipleLineBreaks?: boolean;

    /**
     * Use this mime type instead of the one derived from the file name.
     * Only consulted by `fromFileWithPath`.
     */
    typeOverride?: string;
}

/** Signature every extractor's `extract` function satisfies. */
export type Extractor = (filePath: string, options: ExtractOptions) => Promise<string | Error>;

/**
 * An extractor module's default export. `types` lists the mime types it
 * handles, either verbatim or as a pattern matched against the whole type.
 */
export interface ExtractorModule {
    types: (string | RegExp)[];
    extract: Extractor;
}

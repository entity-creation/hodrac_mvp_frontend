import { useEffect, useState } from "react";
import { getTags } from "../dataStore/tag_apis";
import type { TagClient } from "../models/tag_client";

export function useTags() {
    const [tags, setTags] = useState<TagClient[]>([]);
    const [tagLoading, setTagLoading] = useState(true);

    useEffect(() => {
        getTags()
        .then(setTags)
        .finally(() => setTagLoading(false));
    }, [])

    return {tags, tagLoading};
}
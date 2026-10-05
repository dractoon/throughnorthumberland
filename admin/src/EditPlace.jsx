import { useEffect, useState } from "react";
import { supabase } from "./supabase";

async function resizeImage(file, maxWidth = 1600, maxHeight = 1200, quality = 0.8) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = (event) => {

            const image = new Image();

            image.onload = () => {

                let width = image.width;
                let height = image.height;

                const scale = Math.min(
                    maxWidth / width,
                    maxHeight / height,
                    1
                );

                width = Math.round(width * scale);
                height = Math.round(height * scale);

                const canvas = document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                context.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );

                canvas.toBlob(
                    (blob) => {

                        if (!blob) {
                            reject(new Error("Could not resize image."));
                            return;
                        }

                        resolve(blob);

                    },
                    "image/jpeg",
                    quality
                );

            };

            image.onerror = () => {
                reject(new Error("Could not read image."));
            };

            image.src = event.target.result;

        };

        reader.onerror = () => {
            reject(new Error("Could not read file."));
        };

        reader.readAsDataURL(file);

    });

}

function EditPlace({ placeId, onSaved, onCancel }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        title: "",
        slug: "",
        highlights: [],
        category: "",
        explore_categories: [],
        address: "",
        postcode: "",
        dog_friendly: "",
        family_friendly: "",
        accessibility: "",
        toilets: "",
        website: "",
        opening_hours: "",
        nearby: [],
        description: "",
        intro: "",
        overview: "",
        getting_there: "",
        best_time: "",
        parking: "",
        latitude: "",
        longitude: "",
        image: "",
        status: "published",
        featured: false,
    });

useEffect(() => {
    loadPlace();
    loadCategories();
}, [placeId]);

    async function loadPlace() {
        setLoading(true);
        setMessage("");

        const { data, error } = await supabase
            .from("places")
            .select("*")
            .eq("id", placeId)
            .single();

        if (error) {
            console.error("Error loading place:", error);
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setForm({
            title: data.title || "",
            slug: data.slug || "",
            highlights: data.highlights || [],
            category: data.category || "",
            explore_categories: data.explore_categories || [],
            category: data.category || "",
            address: data.address || "",
            postcode: data.postcode || "",
            dog_friendly: data.dog_friendly || "",
            family_friendly: data.family_friendly || "",
            accessibility: data.accessibility || "",
            toilets: data.toilets || "",
            website: data.website || "",
            opening_hours: data.opening_hours || "",
            nearby: data.nearby || [],
            description: data.description || "",
            intro: data.intro || "",
            overview: data.overview || "",
            getting_there: data.getting_there || "",
            best_time: data.best_time || "",
            parking: data.parking || "",
            latitude: data.latitude ?? "",
            longitude: data.longitude ?? "",
            image: data.image || "",
            status: data.status || "published",
            featured: data.featured || false,
        });

        setImagePreview(data.image || "");
        setLoading(false);
    }

    async function loadCategories() {

    const { data, error } = await supabase
        .from("explore_categories")
        .select("id, name, slug")
        .eq("active", true)
        .order("sort_order", {
            ascending: true
        });

    if (error) {
        console.error("Error loading categories:", error);
        return;
    }

    setCategories(data || []);
}

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function handleFileChange(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setMessage("Please choose an image file.");
            return;
        }

        setSelectedFile(file);
        setMessage("");

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setMessage("");

        let imageUrl = form.image;

        /*
         * Upload a new image if one has been selected.
         */
        if (selectedFile) {
            const fileExtension =
                selectedFile.name.split(".").pop();

            const fileName =
                `${form.slug}-${crypto.randomUUID()}.${fileExtension}`;

            const filePath = `places/${fileName}`;

            const { error: uploadError } =
                await supabase.storage
                    .from("place-images")
                    .upload(filePath, selectedFile, {
                        cacheControl: "3600",
                        upsert: false,
                    });

            if (uploadError) {
                console.error(
                    "Error uploading image:",
                    uploadError
                );

                setMessage(uploadError.message);
                setSaving(false);
                return;
            }

            const { data: publicUrlData } =
                supabase.storage
                    .from("place-images")
                    .getPublicUrl(filePath);

            imageUrl = publicUrlData.publicUrl;
        }

        /*
         * Update the existing place.
         */
        const { data, error } = await supabase
            .from("places")
            .update({
                title: form.title,
                slug: form.slug,
                category: form.category,
                explore_categories: form.explore_categories,
                address: form.address,
                postcode: form.postcode,
                dog_friendly: form.dog_friendly,
                family_friendly: form.family_friendly,
                accessibility: form.accessibility,
                toilets: form.toilets,
                website: form.website,
                opening_hours: form.opening_hours,
                nearby: form.nearby,
                highlights: form.highlights,
                description: form.description,
                intro: form.intro,
                overview: form.overview,
                getting_there: form.getting_there,
                best_time: form.best_time,
                parking: form.parking,
                latitude: form.latitude === "" ? null : Number(form.latitude),
                longitude: form.longitude === "" ? null : Number(form.longitude),
                image: imageUrl,
                status: form.status,
                featured: form.featured,
            })
            .eq("id", placeId)
            .select()
            .single();

       if (error) {
    console.error("Update place error:", error);
    setMessage(`Error saving place: ${error.message}`);
    setSaving(false);
    return;
}

        setSaving(false);

        if (onSaved) {
            onSaved(data);
        }
    }

    if (loading) {
        return (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <p style={styles.muted}>
                        Loading place...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay}>

            <div style={styles.modal}>

                <div style={styles.header}>

                    <div>
                        <p style={styles.eyebrow}>
                            CONTENT
                        </p>

                        <h2 style={styles.heading}>
                            Edit {form.title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        style={styles.closeButton}
                    >
                        ×
                    </button>

                </div>

                <form onSubmit={handleSubmit}>

                    <label style={styles.label}>
                        Place name
                    </label>

                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        required
                        style={styles.input}
                    />

                    <label style={styles.label}>
                        Slug
                    </label>

                    <input
                        name="slug"
                        value={form.slug}
                        onChange={handleChange}
                        required
                        style={styles.input}
                    />

                    <p style={styles.help}>
                        This becomes the web address, for example:
                        /places/bamburgh/
                    </p>

                    <label style={styles.label}>
                        Category
                    </label>

<select
    name="category"
    value={form.category}
    onChange={handleChange}
    required
    style={styles.input}
>
    <option value="">Choose a category</option>

    {categories.map((category) => (
        <option
            key={category.id}
            value={category.name}
        >
            {category.name}
        </option>
    ))}

</select>
<label style={styles.label}>
    Explore categories
</label>

<div style={styles.categoryGrid}>

{categories.map((category) => (

    <label
        key={category.id}
        style={styles.exploreCategoryLabel}
    >

        <input
            type="checkbox"
            checked={form.explore_categories.includes(category.name)}
            onChange={(event) => {

                setForm((current) => {

                    const selectedCategories =
                        event.target.checked
                            ? [
                                ...current.explore_categories,
                                category.name,
                            ]
                            : current.explore_categories.filter(
                                (item) => item !== category.name
                            );

                    return {
                        ...current,
                        explore_categories: selectedCategories,
                    };

                });

            }}
        />

        {category.name}

    </label>

))}

</div>

<p style={styles.help}>
    Select every Explore section this place belongs to.
</p>
                    <label style={styles.label}>
                        Short description
                    </label>

                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows="3"
                        required
                        style={styles.textarea}
                    />

                    <label style={styles.label}>
                        Intro
                    </label>

                    <textarea
                        name="intro"
                        value={form.intro}
                        onChange={handleChange}
                        rows="4"
                        required
                        style={styles.textarea}
                    />

                    <label style={styles.label}>
                        Overview
                    </label>

                    <textarea
                        name="overview"
                        value={form.overview}
                        onChange={handleChange}
                        rows="5"
                        style={styles.textarea}
                    />

                    <label style={styles.label}>
                        Getting there
                    </label>

                    <textarea
                        name="getting_there"
                        value={form.getting_there}
                        onChange={handleChange}
                        rows="4"
                        style={styles.textarea}
                    />

                    <label style={styles.label}>
                        Best time to visit
                    </label>

                    <textarea
                        name="best_time"
                        value={form.best_time}
                        onChange={handleChange}
                        rows="3"
                        style={styles.textarea}
                    />

                    <label style={styles.label}>
                        Parking
                    </label>

                    <textarea
                        name="parking"
                        value={form.parking}
                        onChange={handleChange}
                        rows="3"
                        style={styles.textarea}
                    />
                    <label style={styles.label}>
    Address
</label>

<input
    name="address"
    value={form.address}
    onChange={handleChange}
    placeholder="e.g. Bamburgh, Northumberland"
    style={styles.input}
/>

<label style={styles.label}>
    Postcode
</label>

<input
    name="postcode"
    value={form.postcode}
    onChange={handleChange}
    placeholder="e.g. NE69 7DF"
    style={styles.input}
/>

<label style={styles.label}>
    Dog friendly
</label>

<input
    name="dog_friendly"
    value={form.dog_friendly}
    onChange={handleChange}
    placeholder="e.g. Dogs welcome on leads"
    style={styles.input}
/>

<label style={styles.label}>
    Family friendly
</label>

<input
    name="family_friendly"
    value={form.family_friendly}
    onChange={handleChange}
    placeholder="e.g. Family friendly"
    style={styles.input}
/>

<label style={styles.label}>
    Accessibility
</label>

<textarea
    name="accessibility"
    value={form.accessibility}
    onChange={handleChange}
    placeholder="Accessibility information."
    rows="3"
    style={styles.textarea}
/>

<label style={styles.label}>
    Toilets
</label>

<input
    name="toilets"
    value={form.toilets}
    onChange={handleChange}
    placeholder="e.g. Public toilets nearby"
    style={styles.input}
/>

<label style={styles.label}>
    Website
</label>

<input
    name="website"
    type="url"
    value={form.website}
    onChange={handleChange}
    placeholder="https://..."
    style={styles.input}
/>

<label style={styles.label}>
    Opening hours
</label>

<input
    name="opening_hours"
    value={form.opening_hours}
    onChange={handleChange}
    placeholder="e.g. Open daily 10am–5pm"
    style={styles.input}
/>
<label style={styles.label}>
    Nearby places
</label>

{form.nearby.map((item, index) => (

    <div
        key={index}
        style={styles.nearbyRow}
    >

        <input
            value={item.title || ""}
            onChange={(event) => {

                const nearby = [...form.nearby];

                nearby[index] = {
                    ...nearby[index],
                    title: event.target.value,
                };

                setForm((current) => ({
                    ...current,
                    nearby,
                }));

            }}
            placeholder="Place name"
            style={styles.input}
        />

        <input
            value={item.distance || ""}
            onChange={(event) => {

                const nearby = [...form.nearby];

                nearby[index] = {
                    ...nearby[index],
                    distance: event.target.value,
                };

                setForm((current) => ({
                    ...current,
                    nearby,
                }));

            }}
            placeholder="e.g. 5 min walk"
            style={styles.input}
        />

        <button
            type="button"
            onClick={() => {

                setForm((current) => ({
                    ...current,
                    nearby: current.nearby.filter(
                        (_, itemIndex) => itemIndex !== index
                    ),
                }));

            }}
            style={styles.removeButton}
        >
            Remove
        </button>

    </div>

))}

<button
    type="button"
    onClick={() => {

        setForm((current) => ({
            ...current,
            nearby: [
                ...current.nearby,
                {
                    title: "",
                    distance: "",
                },
            ],
        }));

    }}
    style={styles.addNearbyButton}
>
    + Add nearby place
</button>

<p style={styles.help}>
    Add useful places visitors can explore nearby.
</p>

<label style={styles.label}>
    Latitude
</label>

<input
    name="latitude"
    type="number"
    step="any"
    value={form.latitude}
    onChange={handleChange}
    style={styles.input}
    placeholder="e.g. 55.6080"
/>

<label style={styles.label}>
    Longitude
</label>

<input
    name="longitude"
    type="number"
    step="any"
    value={form.longitude}
    onChange={handleChange}
    style={styles.input}
    placeholder="e.g. -1.7090"
/>

<p style={styles.help}>
    These coordinates will be used for the interactive map and the location shown on the place page.
</p>
                    <div style={styles.highlightsSection}>

    <div style={styles.sectionHeader}>
        <div>
            <p style={styles.eyebrow}>
                HIGHLIGHTS
            </p>

            <h3 style={styles.sectionTitle}>
                Things to see & do
            </h3>
        </div>

        <button
            type="button"
            onClick={() => {
                setForm((current) => ({
                    ...current,
                    highlights: [
                        ...current.highlights,
                        {
                            title: "",
                            description: "",
                            image: "",
                        },
                    ],
                }));
            }}
            style={styles.addHighlightButton}
        >
            + Add highlight
        </button>
    </div>

    {form.highlights.length === 0 && (
        <p style={styles.help}>
            No highlights added yet.
        </p>
    )}

    {form.highlights.map((highlight, index) => (

        <div
            key={index}
            style={styles.highlightCard}
        >

            <div style={styles.highlightHeader}>

                <strong style={styles.highlightNumber}>
                    Highlight {index + 1}
                </strong>

                <button
                    type="button"
                    onClick={() => {
                        setForm((current) => ({
                            ...current,
                            highlights:
                                current.highlights.filter(
                                    (_, highlightIndex) =>
                                        highlightIndex !== index
                                ),
                        }));
                    }}
                    style={styles.removeHighlightButton}
                >
                    Remove
                </button>

            </div>

            <label style={styles.label}>
                Title
            </label>

            <input
                value={highlight.title || ""}
                onChange={(event) => {
                    const value = event.target.value;

                    setForm((current) => ({
                        ...current,
                        highlights:
                            current.highlights.map(
                                (item, highlightIndex) =>
                                    highlightIndex === index
                                        ? {
                                            ...item,
                                            title: value,
                                        }
                                        : item
                            ),
                    }));
                }}
                style={styles.input}
                placeholder="e.g. Bamburgh Castle"
            />

            <label style={styles.label}>
                Description
            </label>

            <textarea
                value={highlight.description || ""}
                onChange={(event) => {
                    const value = event.target.value;

                    setForm((current) => ({
                        ...current,
                        highlights:
                            current.highlights.map(
                                (item, highlightIndex) =>
                                    highlightIndex === index
                                        ? {
                                            ...item,
                                            description: value,
                                        }
                                        : item
                            ),
                    }));
                }}
                rows="4"
                style={styles.textarea}
                placeholder="Describe this highlight..."
            />

            <label style={styles.label}>
    Highlight photo
</label>

{highlight.image && (
    <img
        src={highlight.image}
        alt={highlight.title || "Highlight"}
        style={{
            width: "100%",
            maxWidth: "300px",
            height: "180px",
            objectFit: "cover",
            borderRadius: "10px",
            marginBottom: "10px",
        }}
    />
)}

<input
    type="file"
    accept="image/*"
    onChange={async (event) => {

        const file = event.target.files[0];

        if (!file) return;

        try {

            const resizedImage = await resizeImage(file);

            const fileName =
                `highlight-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 8)}.jpg`;

            const filePath =
                `${form.slug}/${fileName}`;

            const { error: uploadError } =
                await supabase.storage
                    .from("place-highlights")
                    .upload(
                        filePath,
                        resizedImage,
                        {
                            contentType: "image/jpeg",
                            upsert: false,
                        }
                    );

            if (uploadError) {
                throw uploadError;
            }

            const { data: publicUrlData } =
                supabase.storage
                    .from("place-highlights")
                    .getPublicUrl(filePath);

            const imageUrl =
                publicUrlData.publicUrl;

            const highlights =
                [...form.highlights];

            highlights[index] = {
                ...highlights[index],
                image: imageUrl,
            };

            setForm((current) => ({
                ...current,
                highlights,
            }));

        } catch (error) {

            console.error(
                "Highlight image upload error:",
                error
            );

            alert(
                "There was a problem uploading the image."
            );

        }

    }}
/>

<p style={styles.help}>
    Images are automatically resized before upload.
</p>

            <label style={styles.label}>
                Image URL
            </label>

            <input
                value={highlight.image || ""}
                onChange={(event) => {
                    const value = event.target.value;

                    setForm((current) => ({
                        ...current,
                        highlights:
                            current.highlights.map(
                                (item, highlightIndex) =>
                                    highlightIndex === index
                                        ? {
                                            ...item,
                                            image: value,
                                        }
                                        : item
                            ),
                    }));
                }}
                style={styles.input}
                placeholder="https://..."
            />

        </div>

    ))}

</div>
                    <label style={styles.label}>
                        Main image
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={styles.fileInput}
                    />

                    <p style={styles.help}>
                        Choose a new image to replace the current one.
                    </p>

                    {imagePreview && (
                        <div style={styles.preview}>
                            <img
                                src={imagePreview}
                                alt={form.title}
                                style={styles.previewImage}
                            />
                        </div>
                    )}

                    <div style={styles.twoColumns}>

                        <div>

                            <label style={styles.label}>
                                Status
                            </label>

                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                style={styles.input}
                            >
                                <option value="published">
                                    Published
                                </option>

                                <option value="hidden">
                                    Hidden
                                </option>
                            </select>

                        </div>

                        <div>

                            <label style={styles.label}>
                                Featured
                            </label>

                            <label style={styles.checkboxLabel}>

                                <input
                                    name="featured"
                                    type="checkbox"
                                    checked={form.featured}
                                    onChange={handleChange}
                                />

                                Show as featured

                            </label>

                        </div>

                    </div>

                    {message && (
                        <div style={styles.error}>
                            {message}
                        </div>
                    )}

                    <div style={styles.actions}>

                        <button
                            type="button"
                            onClick={onCancel}
                            style={styles.cancelButton}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            style={styles.saveButton}
                        >
                            {saving
                                ? "Uploading & saving..."
                                : "Save changes"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(32,37,34,0.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "30px",
        zIndex: 1000,
        boxSizing: "border-box",
        overflowY: "auto",
    },

    modal: {
        width: "100%",
        maxWidth: "650px",
        background: "#ffffff",
        borderRadius: "18px",
        padding: "35px",
        boxSizing: "border-box",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        margin: "0 0 30px",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "30px",
    },

    eyebrow: {
        color: "#315b55",
        fontSize: "12px",
        fontWeight: "bold",
        letterSpacing: "1px",
        margin: "0 0 7px",
    },

    heading: {
        color: "#202522",
        margin: 0,
        fontSize: "28px",
    },

    closeButton: {
        border: "none",
        background: "transparent",
        color: "#68706b",
        fontSize: "30px",
        cursor: "pointer",
        lineHeight: 1,
    },

    label: {
        display: "block",
        color: "#202522",
        fontWeight: "600",
        marginBottom: "7px",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        marginBottom: "18px",
        border: "1px solid #dedbd2",
        borderRadius: "8px",
        fontSize: "15px",
        background: "#ffffff",
        color: "#202522",
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        marginBottom: "18px",
        border: "1px solid #dedbd2",
        borderRadius: "8px",
        fontSize: "15px",
        fontFamily: "inherit",
        resize: "vertical",
        color: "#202522",
        background: "#ffffff",
    },

    fileInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px",
        marginBottom: "8px",
        border: "1px solid #dedbd2",
        borderRadius: "8px",
        fontSize: "14px",
        background: "#ffffff",
        color: "#202522",
    },

    help: {
        color: "#68706b",
        fontSize: "13px",
        marginTop: "-10px",
        marginBottom: "18px",
        lineHeight: "1.5",
    },

    preview: {
        marginBottom: "20px",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#f4f1e9",
    },

    previewImage: {
        display: "block",
        width: "100%",
        maxHeight: "300px",
        objectFit: "cover",
    },

    twoColumns: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
    },

    checkboxLabel: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        color: "#202522",
        marginTop: "12px",
    },

    error: {
        background: "#f2d8d3",
        color: "#8f382c",
        padding: "12px",
        borderRadius: "8px",
        marginTop: "10px",
    },

    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "30px",
    },

    cancelButton: {
        padding: "12px 20px",
        background: "#ffffff",
        color: "#315b55",
        border: "1px solid #315b55",
        borderRadius: "8px",
        cursor: "pointer",
    },

    saveButton: {
        padding: "12px 22px",
        background: "#315b55",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
    },

    muted: {
        color: "#68706b",
    },
    highlightsSection: {
    marginTop: "25px",
    marginBottom: "25px",
},

sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "15px",
    marginBottom: "20px",
},

sectionTitle: {
    color: "#202522",
    margin: 0,
    fontSize: "20px",
},

addHighlightButton: {
    padding: "9px 14px",
    background: "#dce7e3",
    color: "#315b55",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
},

highlightCard: {
    background: "#f4f1e9",
    border: "1px solid #dedbd2",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "15px",
},

highlightHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
},

highlightNumber: {
    color: "#202522",
    fontSize: "15px",
},

removeHighlightButton: {
    border: "none",
    background: "transparent",
    color: "#c85c4a",
    cursor: "pointer",
    fontWeight: "600",
},
categoryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "10px",
},

exploreCategoryLabel: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "10px 12px",
    border: "1px solid #dedbd2",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#202522",
    fontSize: "14px",
    cursor: "pointer",
},
nearbyRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "10px",
    alignItems: "start",
},

addNearbyButton: {
    padding: "10px 14px",
    background: "#dce7e3",
    color: "#315b55",
    border: "1px solid #315b55",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    marginBottom: "10px",
},

removeButton: {
    padding: "10px 12px",
    background: "#ffffff",
    color: "#c85c4a",
    border: "1px solid #c85c4a",
    borderRadius: "8px",
    cursor: "pointer",
},
};

export default EditPlace;
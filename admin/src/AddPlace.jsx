import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function AddPlace({ onPlaceAdded, onCancel }) {
    const [categories, setCategories] = useState([]);
    const [features, setFeatures] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const [form, setForm] = useState({
        title: "",
        slug: "",
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
        highlights: [],
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

        async function loadExploreOptions() {

            const { data: categoryData, error: categoryError } =
                await supabase
                    .from("explore_categories")
                    .select("*")
                    .eq("active", true)
                    .order("sort_order", {
                        ascending: true
                    });

            if (categoryError) {
                console.error(
                    "Error loading categories:",
                    categoryError
                );
            } else {
                setCategories(categoryData || []);
            }


            const { data: featureData, error: featureError } =
                await supabase
                    .from("explore_features")
                    .select("*")
                    .eq("active", true)
                    .order("sort_order", {
                        ascending: true
                    });

            if (featureError) {
                console.error(
                    "Error loading features:",
                    featureError
                );
            } else {
                setFeatures(featureData || []);
            }

        }

        loadExploreOptions();

    }, []);

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
        let savedHighlights = [];

for (const highlight of form.highlights) {

    let highlightImageUrl = "";

    if (highlight.imageFile) {

        const fileExtension =
            highlight.imageFile.name.split(".").pop();

        const fileName =
            `${form.slug}-highlight-${crypto.randomUUID()}.${fileExtension}`;

        const filePath =
            `highlights/${fileName}`;

        const { error: uploadError } =
            await supabase.storage
                .from("place-images")
                .upload(
                    filePath,
                    highlight.imageFile,
                    {
                        cacheControl: "3600",
                        upsert: false,
                    }
                );

        if (uploadError) {

            console.error(
                "Error uploading highlight image:",
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

        highlightImageUrl =
            publicUrlData.publicUrl;
    }

    savedHighlights.push({
        title: highlight.title,
        description: highlight.description,
        image: highlightImageUrl,
    });
}

        /*
         * Upload the image first if one has been selected.
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
         * Save the place to the database.
         */
        const { data, error } = await supabase
            .from("places")
            .insert({
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
                highlights: savedHighlights,
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
            .select()
            .single();

                if (error) {
            console.error(
                "Error adding place:",
                error
            );

            setMessage(error.message);
            setSaving(false);
            return;
        }


        /*
         * Link the new place to its Explore categories.
         */

        if (selectedCategories.length) {

            const categoryRows =
                selectedCategories.map((categoryId) => ({
                    place_id: data.id,
                    category_id: categoryId,
                }));

            const {
                error: categoryError
            } = await supabase
                .from("place_categories")
                .insert(categoryRows);

            if (categoryError) {

                console.error(
                    "Error saving place categories:",
                    categoryError
                );

                setMessage(
                    categoryError.message
                );

                setSaving(false);
                return;
            }
        }


        /*
         * Link the new place to its Features.
         */

        if (selectedFeatures.length) {

            const featureRows =
                selectedFeatures.map((featureId) => ({
                    place_id: data.id,
                    feature_id: featureId,
                }));

            const {
                error: featureError
            } = await supabase
                .from("place_features")
                .insert(featureRows);

            if (featureError) {

                console.error(
                    "Error saving place features:",
                    featureError
                );

                setMessage(
                    featureError.message
                );

                setSaving(false);
                return;
            }
        }


        setSaving(false);

        if (onPlaceAdded) {
            onPlaceAdded(data);
        }
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
                            Add a place
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
                        placeholder="e.g. Bamburgh"
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
                        placeholder="e.g. bamburgh"
                        required
                        style={styles.input}
                    />

                    <p style={styles.help}>
                        This becomes the web address, for example:
                        /places/bamburgh/
                    </p>

<label style={styles.label}>
    Primary category
</label>

<select
    name="category"
    value={form.category}
    onChange={handleChange}
    required
    style={styles.input}
>
    <option value="">
        Choose a category
    </option>

    {categories.map((category) => (
        <option
            key={category.id}
            value={category.name}
        >
            {category.name}
        </option>
    ))}
</select>

<p style={styles.help}>
    Choose the main category for this place.
</p>

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
                checked={
                    selectedCategories.includes(category.id)
                }
                onChange={(event) => {

                    setSelectedCategories((current) => {

                        if (event.target.checked) {

                            return [
                                ...current,
                                category.id,
                            ];

                        }

                        return current.filter(
                            (id) =>
                                id !== category.id
                        );

                    });

                }}
            />

            {category.name}

        </label>

    ))}

</div>

<p style={styles.help}>
    Select every category this place belongs to.
</p>

<label style={styles.label}>
    Features
</label>

<div style={styles.categoryGrid}>

    {features.map((feature) => (

        <label
            key={feature.id}
            style={styles.exploreCategoryLabel}
        >

            <input
                type="checkbox"
                checked={
                    selectedFeatures.includes(feature.id)
                }
                onChange={(event) => {

                    setSelectedFeatures((current) => {

                        if (event.target.checked) {

                            return [
                                ...current,
                                feature.id,
                            ];

                        }

                        return current.filter(
                            (id) =>
                                id !== feature.id
                        );

                    });

                }}
            />

            {feature.name}

        </label>

    ))}

</div>

<p style={styles.help}>
    Select every feature visitors should know about.
</p>

                    <label style={styles.label}>
                        Short description
                    </label>

                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="A short description of the place."
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
                        placeholder="A slightly longer introduction."
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
                        placeholder="Tell visitors why they should visit this place."
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
                        placeholder="How can visitors get there?"
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
                        placeholder="When is the best time to visit?"
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
                        placeholder="Parking information."
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
            value={item.title}
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
            value={item.distance}
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
    Highlights
</label>

{form.highlights.map((highlight, index) => (

    <div
        key={index}
        style={{
            border: "1px solid #dedbd2",
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "18px",
            background: "#f8f7f3",
        }}
    >

        <label style={styles.label}>
            Highlight title
        </label>

        <input
            value={highlight.title}
            onChange={(event) => {

                const highlights = [...form.highlights];

                highlights[index] = {
                    ...highlights[index],
                    title: event.target.value,
                };

                setForm((current) => ({
                    ...current,
                    highlights,
                }));

            }}
            placeholder="e.g. Bamburgh Castle"
            style={styles.input}
        />

        <label style={styles.label}>
            Description
        </label>

        <textarea
            value={highlight.description}
            onChange={(event) => {

                const highlights = [...form.highlights];

                highlights[index] = {
                    ...highlights[index],
                    description: event.target.value,
                };

                setForm((current) => ({
                    ...current,
                    highlights,
                }));

            }}
            placeholder="Describe this highlight."
            rows="4"
            style={styles.textarea}
        />

        <label style={styles.label}>
            Highlight image
        </label>

        <input
            type="file"
            accept="image/*"
            onChange={(event) => {

                const file = event.target.files?.[0];

                if (!file) {
                    return;
                }

                if (!file.type.startsWith("image/")) {
                    setMessage("Please choose an image file.");
                    return;
                }

                const previewUrl =
                    URL.createObjectURL(file);

                const highlights =
                    [...form.highlights];

                highlights[index] = {
                    ...highlights[index],
                    imageFile: file,
                    imagePreview: previewUrl,
                };

                setForm((current) => ({
                    ...current,
                    highlights,
                }));

                setMessage("");

            }}
            style={styles.fileInput}
        />

        {highlight.imagePreview && (
            <div style={styles.preview}>
                <img
                    src={highlight.imagePreview}
                    alt="Highlight preview"
                    style={styles.previewImage}
                />
            </div>
        )}

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
            style={styles.removeButton}
        >
            Remove highlight
        </button>

    </div>

))}

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
                    imageFile: null,
                    imagePreview: "",
                },
            ],
        }));

    }}
    style={styles.addNearbyButton}
>
    + Add highlight
</button>

<p style={styles.help}>
    Add the main things visitors should see or do here.
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
                        Choose an image from your computer.
                        It will be uploaded automatically when
                        you save the place.
                    </p>

                    {imagePreview && (
                        <div style={styles.preview}>
                            <img
                                src={imagePreview}
                                alt="Selected preview"
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
                                : "Save place"}
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

export default AddPlace;
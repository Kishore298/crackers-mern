const Product = require("../models/Product");
const StockLedger = require("../models/StockLedger");
const Sale = require("../models/Sale");
const Category = require("../models/Category");
const { cloudinary } = require("../config/cloudinary");
const xlsx = require("xlsx");

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Extract the 11-char YouTube video ID from various URL formats.
 * Supports:
 *   - youtube.com/watch?v=VIDEO_ID
 *   - youtube.com/shorts/VIDEO_ID
 *   - youtu.be/VIDEO_ID
 *   - Already-extracted plain video IDs
 * Returns empty string if input is invalid.
 */
const extractYouTubeId = (input) => {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Already a plain ID (11 chars, alphanumeric + _ + -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    // youtube.com/watch?v=VIDEO_ID or youtube.com/embed/VIDEO_ID
    const watchMatch = trimmed.match(/youtube\.com\/(?:watch\?.*v=|embed\/)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    // youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
  } catch (_) {}
  return ""; // invalid or unrecognized format
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      sort,
      min,
      max,
      page = 1,
      limit = 20,
    } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    
    // Support combo filtering (if isCombo=true is passed, fetch combos. Else fetch normal products)
    if (req.query.isCombo === "true") {
      filter.isCombo = true;
    } else {
      filter.isCombo = { $ne: true };
    }

    if (min || max) {
      filter.discountedPrice = {};
      if (min) filter.discountedPrice.$gte = Number(min);
      if (max) filter.discountedPrice.$lte = Number(max);
    }

    const sortMap = {
      price_asc: { discountedPrice: 1 },
      price_desc: { discountedPrice: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };
    const sortOption = sortMap[sort] || { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("comboProducts.product", "name images price discountedPrice stock")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/admin - all including inactive (admin)
const getAdminProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category, isActive, sort } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    if (isActive !== undefined && isActive !== "") filter.isActive = isActive === "true";
    
    if (req.query.isCombo === "true") {
      filter.isCombo = true;
    } else if (req.query.isCombo === "false") {
      filter.isCombo = { $ne: true };
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
    };
    // Default to 'category' sort if not specified
    const sortOption = sortMap[sort] || null;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    
    let productsQuery = Product.find(filter)
      .populate("category", "name slug order")
      .populate("comboProducts.product", "name images price discountedPrice stock");
      
    if (sortOption) {
      productsQuery = productsQuery.sort(sortOption).skip(skip).limit(Number(limit));
    }
    
    let products = await productsQuery;

    // If sorting by category (default), we do an in-memory sort and then paginate
    if (!sortOption) {
      products.sort((a, b) => {
        const indexA = a.category && a.category.order !== undefined ? a.category.order : 9999;
        const indexB = b.category && b.category.order !== undefined ? b.category.order : 9999;
        if (indexA === indexB) {
          const catNameA = a.category ? a.category.name : "";
          const catNameB = b.category ? b.category.name : "";
          const catComp = catNameA.localeCompare(catNameB);
          if (catComp !== 0) return catComp;
          return a.name.localeCompare(b.name);
        }
        return indexA - indexB;
      });
      products = products.slice(skip, skip + Number(limit));
    }

    res.json({ success: true, products, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:slug
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate("category", "name slug").populate("comboProducts.product");
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/id/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug",
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products (admin)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountedPrice,
      stock,
      category,
      safetyInstructions,
      youtubeId,
      isCombo,
      comboProducts,
    } = req.body;
    if (!name || !price || !stock || !category)
      return res.status(400).json({
        success: false,
        message: "Name, price, stock, category required",
      });

    let slug = slugify(name);
    // Ensure unique slug
    let count = 0;
    while (await Product.findOne({ slug }))
      slug = `${slugify(name)}-${++count}`;

    const images = req.files
      ? req.files.map((f) => ({ url: f.path, publicId: f.filename }))
      : [];

    const product = await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
      stock: Number(stock),
      category,
      images,
      video: { youtubeId: extractYouTubeId(youtubeId) },
      safetyInstructions,
      isCombo: isCombo === "true" || isCombo === true,
      comboProducts: comboProducts ? (Array.isArray(comboProducts) ? comboProducts : JSON.parse(comboProducts)) : [],
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const fields = [
      "name",
      "description",
      "price",
      "discountedPrice",
      "stock",
      "category",
      "safetyInstructions",
      "isActive",
      "isCombo",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if (f === "isCombo") product[f] = req.body[f] === "true" || req.body[f] === true;
        else product[f] = req.body[f];
      }
    });

    if (req.body.comboProducts !== undefined) {
      product.comboProducts = Array.isArray(req.body.comboProducts) 
        ? req.body.comboProducts 
        : JSON.parse(req.body.comboProducts);
    }
    if (req.body.youtubeId !== undefined)
      product.video.youtubeId = extractYouTubeId(req.body.youtubeId);

    if (req.files && req.files.length > 0) {
      product.images = req.files.map((f) => ({
        url: f.path,
        publicId: f.filename,
      }));
    }

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    for (const img of product.images) {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
    }
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/low-stock (admin)
const getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;
    const products = await Product.find({ stock: { $lte: threshold } }).sort({
      stock: 1,
    });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// PUT /api/products/:id/images/reorder (admin)
const reorderImages = async (req, res) => {
  try {
    const { images } = req.body; // Array of { url, publicId } in desired order
    if (!Array.isArray(images))
      return res.status(400).json({ success: false, message: "images array required" });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { images } },
      { returnDocument: "after" },
    );
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id/images/:publicId (admin)
const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    const { publicId } = req.params;
    // Remove from Cloudinary
    try { await cloudinary.uploader.destroy(publicId); } catch (e) {}

    product.images = product.images.filter((img) => img.publicId !== publicId);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products/upload-excel (admin)
const uploadExcel = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const file = req.files[0];
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Start reading from row 2 (index 1) as headers
    const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (json.length < 2) {
       return res.status(400).json({ success: false, message: "Excel sheet is empty or missing data" });
    }

    const rawHeaders = json[1] || [];
    const headers = rawHeaders.map(h => h ? h.toString().trim().toLowerCase() : '');
    
    let createdCount = 0;
    let updatedCount = 0;
    let errors = [];
    
    let currentCategory = '';
    const processedProductIds = [];

    for (let i = 2; i < json.length; i++) {
      const rowNum = i + 1; // 1-indexed row number
      const row = json[i];
      if (!row || row.length === 0) continue;

      const rowData = {};
      headers.forEach((header, index) => {
        if (header) {
          rowData[header] = row[index];
        }
      });

      let catName = rowData['category'] || rowData['cat'];
      if (catName) {
        currentCategory = catName.toString().trim();
      } else {
        catName = currentCategory;
      }
      
      const prodName = rowData['product'] || rowData['product name'] || rowData['name'];
      
      if (!prodName) {
        errors.push(`Row ${rowNum}: Product name is missing.`);
        continue;
      }
      
      if (!catName) {
        errors.push(`Row ${rowNum}: Category is missing and no previous category found.`);
        continue;
      }

      let salesPriceRaw = rowData['sales price'];
      let priceRaw = rowData['price'] || rowData['mrp'];
      
      let parsedPrice = parseFloat(priceRaw);
      let parsedSalesPrice = parseFloat(salesPriceRaw);
      
      if (isNaN(parsedPrice) && isNaN(parsedSalesPrice)) {
        errors.push(`Row ${rowNum}: Invalid price for product '${prodName}'.`);
        continue;
      }
      
      let finalPrice = !isNaN(parsedPrice) ? parsedPrice : parsedSalesPrice;
      let finalDiscountedPrice = !isNaN(parsedSalesPrice) ? parsedSalesPrice : finalPrice;

      if (finalPrice <= 0) {
        errors.push(`Row ${rowNum}: Price must be greater than 0 for product '${prodName}'.`);
        continue;
      }

      let stockRaw = rowData['stock'] || rowData['cases'] || rowData['qty'];
      let stockVal = parseInt(stockRaw, 10);
      if (isNaN(stockVal) || stockVal < 0) {
        stockVal = 0; // Default to 0 if invalid
      }
      
      let description = rowData['description'] || rowData['desc'] || '';
      let youtubeId = rowData['youtube link'] || rowData['youtube video link'] || rowData['youtube id'] || '';

      // Find or create category
      let category = await Category.findOne({ name: { $regex: new RegExp(`^${catName}$`, 'i') } });
      if (!category) {
        let slug = slugify(catName);
        let count = 0;
        let tempCatSlug = slug;
        while (await Category.findOne({ slug: tempCatSlug })) {
           tempCatSlug = `${slug}-${++count}`;
        }
        category = await Category.create({ name: catName, slug: tempCatSlug });
      }

      const productData = {
         name: prodName.toString().trim(),
         category: category._id,
         price: finalPrice,
         discountedPrice: finalDiscountedPrice,
         stock: stockVal,
         description: description,
         isActive: true
      };

      if (youtubeId) {
         productData.video = { youtubeId: extractYouTubeId(youtubeId) };
      }

      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingProduct = await Product.findOne({ name: { $regex: new RegExp(`^${escapeRegex(prodName.toString().trim())}$`, 'i') } });
      
      try {
        if (existingProduct) {
           await Product.findByIdAndUpdate(existingProduct._id, productData);
           processedProductIds.push(existingProduct._id);
           updatedCount++;
        } else {
           let slug = slugify(prodName.toString().trim());
           let count = 0;
           let tempSlug = slug;
           while (await Product.findOne({ slug: tempSlug })) {
             tempSlug = `${slug}-${++count}`;
           }
           productData.slug = tempSlug;
           const newProduct = await Product.create(productData);
           processedProductIds.push(newProduct._id);
           createdCount++;
        }
      } catch (err) {
        errors.push(`Row ${rowNum}: Failed to save product '${prodName}' - ${err.message}`);
      }
    }

    // Delete standard products (non-combos) that were not in the Excel file
    let deleteCount = 0;
    if (processedProductIds.length > 0) {
      const deleteResult = await Product.deleteMany({
        _id: { $nin: processedProductIds },
        isCombo: { $ne: true }
      });
      deleteCount = deleteResult.deletedCount;
    }

    res.json({ 
      success: true, 
      message: `Successfully processed ${createdCount + updatedCount} products. (${createdCount} created, ${updatedCount} updated, ${deleteCount} removed)`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("Excel upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  reorderImages,
  deleteProductImage,
  uploadExcel,
};

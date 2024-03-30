const Product = require('../models/product');
const { validationResult } = require('express-validator')
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        product: {
            title : '',
            description:'',
            price:0
        },

        errorMessage:false,
        validationErrors:[]
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    console.log(image);
    const errors = validationResult(req);
    console.log(errors.array());
    if(errors.array().length){
        const err =  errors.array()[0].msg;
        return res.status(422).render('admin/edit-product' , {
            path: '/admin/add-product',
            pageTitle: 'Add Product',
            editing: false,
            product: {
                title : title,
                description:description,
                price:price
            },
            errorMessage: err,
            validationErrors: errors.array()
        })
    }
    if(!image){
        return res.status(422).render('admin/edit-product' , {
            path: '/admin/add-product',
            pageTitle: 'Add Product',
            editing: false,
            product: {
                title : title,
                description:description,
                price:price
            },
            errorMessage: 'Attached file is not an image',
            validationErrors: []
        })
    }
    const imageUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId:  req.session.user._id
    });

    console.log(product);
    product
        .save()
        .then(result => {
            // console.log(result);
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                throw new Error();
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                errorMessage: false,
                validationErrors: []
            });
        })
        .catch(err => {
            console.log(err)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;
    const errors = validationResult(req);
    console.log(errors.array());
    if(errors.array().length){
        const err =  errors.array()[0].msg;
        return res.status(422).render('admin/edit-product' , {
            path: '/admin/add-product',
            pageTitle: 'Add Product',
            editing: true,
            product: {
                title : updatedTitle,
                description:updatedDescription,
                price:updatedPrice
            },
            errorMessage: err,
            validationErrors: errors.array()
        })
    }
    console.log(1111);
    Product.findById(prodId)
        .then(product => {
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;
            if(image) {
                console.log(product.imageUrl);
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;}
            return product.save();
        })
        .then(result => {
            console.log('UPDATED PRODUCT!');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.session.user._id})
        // .select('title price -_id')
        // .populate('userId', 'name')
        .then(products => {
            //   console.log(products);
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
            });
        })
        .catch(err => {
            console.log(err)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
        if(!product) next(new Error('product not found'));
        fileHelper.deleteFile(product.imageUrl);
        return Product.findByIdAndRemove(prodId)
    })
    .then(() => {
        console.log('DESTROYED PRODUCT');
        res.status(200).json({message: 'Success!'});
    })
    .catch(err => {
        res.status(500).json({message: 'FAIL!'});
    });
    
};

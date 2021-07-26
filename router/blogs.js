const express = require('express');
const router=express.Router();
const connectEnsureLogin=require('connect-ensure-login');
const Blogs =require('./../models/blogs');
const Comments=require('./../models/comment');
const Users =require('./../models/users')
const sanitizeHtml = require('sanitize-html');


// All blogs
router.get('/',async(req,res)=>{
    try {
        var check=false;
        if(req.isAuthenticated())
        {
            check=true;
        }
        var showall = await Blogs.find({});
        res.render('blogs/index',{blog: showall,loginout:check});
    } 
    catch (error) {
        res.redirect('/blogs/')
    }
})

//Get a post page for new blog
router.get('/submit',connectEnsureLogin.ensureLoggedIn('/users/login'),(req,res)=>{
    var check=false;
    if(req.isAuthenticated())
    {
        check=true;
    }
    res.render('blogs/submit',{loginout:check})
})

//Getting a paricular blog
router.get('/:id',async(req,res)=>{
    try {
        var check=false;
        if(req.isAuthenticated())
        {
            check=true;
        }
        var show=await Blogs.findById(req.params.id);
        var name=await Users.findById(show.user);
        var allcomments=show.comment;
        var showcomment=[];
        for(var i in allcomments)
        {
            var comment= await Comments.findById(allcomments[i]);
            showcomment.push(comment); 
        }
        var user_name=[]
        for(var i in showcomment)
        {
            var user=await Users.findById(showcomment[i].user)
            user_name.push(user.username)
        }
        res.render('blogs/single',{blog:show,comment:showcomment,names:user_name,loginout:check,user:name.username});
    } catch (error) {
        res.redirect('/blogs/')
    }
})

//Adding a blog
router.post('/submit',async(req,res)=>{
    
    var dirtycontent=req.body.content;
    var dirtytitle=req.body.title;
    var cleancontent=sanitizeHtml(dirtycontent,{
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ])
      });
    var cleantitle=sanitizeHtml(dirtytitle);

    var m,
    url=[], 
    str = cleancontent,
    rex = /<img[^>]+src="?([^"\s]+)"?\s*\/>/g;
    
    while ( m = rex.exec( str ) ) 
    {
        url.push( m[1] );
        break;
    }
    if(url.length<1)
    url.push('/img/thumbnail.jpg');

    var blog=new Blogs({
        title: cleantitle,
        content : cleancontent,
        user : req.user._id,
        thumbnail : url[0],
        date : Date.now()
    })
    try {
        savedblog = await blog.save()
        res.redirect(`/blogs/${savedblog.id}`)
        req.flash('success','Blog added')
    } catch (error) {
        console.log(error)
        res.redirect('/blogs/submit');
        req.flash('failure','Blog not added')
    }
})

//Delete blog
router.delete('/:id',connectEnsureLogin.ensureLoggedIn('/users/login'),async(req,res)=>{
    var blogid=req.params.id;
    var blog=await Blogs.findById(blogid);
    if(JSON.stringify(req.user._id)===JSON.stringify(blog.user)){
    try {
        await Blogs.findByIdAndRemove(blogid);
        req.flash('successMessage','Blog removed');
        res.redirect('/blogs/');
        // req.flash('successMessage','Blog removed');   
    } catch (error) {
        console.log(error);
        req.flash('failure','Blog not removed');
        res.redirect('/blogs/');
    }}
    else{
        req.flash('failure','You are not the author of blog')
        res.redirect('/blogs/');
    }
})

//Edit get
router.get('/edit/:id',connectEnsureLogin.ensureLoggedIn('/users/login'),async(req,res)=>{
    var check=false;
    if(req.isAuthenticated())
    {
        check=true;
    }
    const blog_id=req.params.id;
    var blog=await Blogs.findById(blog_id);
    if(JSON.stringify(req.user._id)===JSON.stringify(blog.user)){
    try {
        res.render('blogs/edit',{blog:blog,loginout:check});
    } catch (error) {
        console.log(error);
    }}
    else{
        req.flash('failure','You are not the author of blog')
        res.redirect('/blogs/');
    }
})


//Edit blog
router.put('/:id',async(req,res)=>{
    const id_blog=req.params.id;
    var dirtycontent=req.body.content;
    var dirtytitle=req.body.title;
    var cleancontent=sanitizeHtml(dirtycontent,{
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ])
      });
    var cleantitle=sanitizeHtml(dirtytitle);
    try {
        const to_save=await Blogs.findById(id_blog);
        to_save.title=cleantitle;
        to_save.content=cleancontent;
        await to_save.save();
        req.flash('success','Blog edited successfully')
        res.redirect(`/blogs/${to_save.id}`);
    } catch (error) {
        console.log(error)
        req.flash('failure','Blog not edited')
        res.redirect('/blogs/');
    }
})

//like route
router.post('/:id/like',connectEnsureLogin.ensureLoggedIn('/users/login'),async(req,res)=>{
    const blog_id=req.params.id;
    try {       
        const blog=await Blogs.findById(blog_id);
        var x=0;
        var flag=0;
        for(var i in blog.likedby){
            if(toString(blog.likedby[i])===toString(req.user._id))
            {
                blog.likes-=1;
                blog.likedby.splice(x,1);
                flag=1;
                break;
            }
            x++;
        }
        if(flag==0)
        {
            blog.likedby.push(req.user._id);
            await Blogs.findOne({_id:blog_id}).populate({
                path: 'likedby',
                model: 'User'
            })
            blog.likes=blog.likes+1;
        }
        await blog.save();
        res.redirect(`/blogs/${blog.id}`);
    } catch (error) {
        console.log(err);
    }
})

//comment
router.post('/:id/comment',connectEnsureLogin.ensureLoggedIn('/users/login'),async(req,res)=>{
    try {
        var dirtycomment=req.body.comment;
        var cleancomment=sanitizeHtml(dirtycomment);
        const comm= new Comments({
            body : cleancomment,
            user: req.user._id,
            date: Date.now()
        })
        await comm.save()
        const blogid=req.params.id;
        const blog = await Blogs.findById(blogid);
        blog.comment.push(comm);
        await blog.save();
        req.flash('success','Comment added');
        res.redirect(`/blogs/${blog.id}`);
    } 
    catch (error) {
        req.flash('failure','Comment not added');
        res.redirect(`/blogs/${blog.id}`);
    }
})

//del comment
router.delete('/:id1/:id2',connectEnsureLogin.ensureLoggedIn('/user/login'),async(req,res)=>{
    try {

        const comment=await Comments.findById(req.params.id2);
        if(JSON.stringify(req.user._id)===JSON.stringify(comment.user)){
        const blog=await Blogs.findByIdAndUpdate(
            req.params.id1,
            {
              $pull: { comment: req.params.id2 },
            },
            { new: true }
          );
          await Comments.findByIdAndRemove(req.params.id2);
          req.flash('success','Comment deleted');
          res.redirect(`/blogs/${req.params.id1}`);
        }
        else{
            console.log('hello')
            req.flash('failure','Comment not written by you');
            res.redirect(`/blogs/${req.params.id1}`);
        }
    } catch (error) {
        req.flash('failure','comment not deleted')
        res.redirect(`/blogs/${blog.id}`);
    }
})

module.exports = router;
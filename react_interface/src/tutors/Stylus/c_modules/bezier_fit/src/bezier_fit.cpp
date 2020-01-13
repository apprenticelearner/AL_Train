/*
An Algorithm for Automatically Fitting Digitized Curves
by Philip J. Schneider
from "Graphics Gems", Academic Press, 1990
*/

#define TESTMODE

/*  fit_cubic.c */                                  
/*  Piecewise cubic fitting code    */

#include "GraphicsGems.h"                   
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <list>
#include <chrono> 
#include <limits>

using namespace std::chrono; 

typedef Point2 *BezierCurve;

/* Forward declarations */
extern "C" {
    int c_FitCurve(double *points, int nPts, double error, double *output);
    void c_ML_EncodeCurves(double *curves, int nCurves, double *output);
}
std::list<BezierCurve>  FitCurve(Point2  *d, int nPts, double  error);    
std::list<int> InflectionPoints(Point2  *d,int nPts);
std::list<int> CurveAvgInflectionPoints(Point2  *d,int nPts);
std::list<BezierCurve> FitCurve_Inflections(Point2  *d, int nPts, double  error);
double RegionDiff(int region1, int region2);
double AngleDiff(double angle1, double angle2);
int AngleRegion(double angle);
static  std::list<BezierCurve>  FitCubic(Point2 *d, int first, int last,  Vector2 tHat1, Vector2 tHat2, double error);
static  double      *Reparameterize(Point2 *d, int first, int last, double *u, BezierCurve bezCurve);
static  double      NewtonRaphsonRootFind(BezierCurve Q,Point2 P,double u);
static  Point2      BezierII(int degree, Point2 *V, double t);
static  double      B0(double u), B1(double u), B2(double u), B3(double u);
static  Vector2     ComputeLeftTangent(Point2 *d, int end);
static  Vector2     ComputeRightTangent(Point2 *d, int end);
static  Vector2     ComputeCenterTangent(Point2 *d, int center);
static  double      ComputeMaxError(Point2 *d, int first, int last, BezierCurve bezCurve, double *u, int *splitPoint);
static  double      *ChordLengthParameterize(Point2 *d, int first, int last);
static  BezierCurve GenerateBezier(Point2   *d, int first, int last, double *uPrime, Vector2 tHat1, Vector2 tHat2);
static  Vector2     V2AddII(Vector2 a, Vector2 b);
static  Vector2     V2ScaleIII(Vector2 v,double s);
static  Vector2     V2SubII(Vector2 a, Vector2 b);

#define MAXPOINTS   1000        /* The most points you can have */

#ifdef TESTMODE

void DrawBezierCurve(int n, BezierCurve curve)
{
    /* You'll have to write this yourself. */
}

/*
 *  main:
 *  Example of how to use the curve-fitting code.  Given an array
 *   of points and a tolerance (squared error between points and 
 *  fitted curve), the algorithm will generate a piecewise
 *  cubic Bezier representation that approximates the points.
 *  When a cubic is generated, the routine "DrawBezierCurve"
 *  is called, which outputs the Bezier curve just created
 *  (arguments are the degree and the control points, respectively).
 *  Users will have to implement this function themselves   
 *   ascii output, etc. 
 *
 */
int main()
{   
    std::list<BezierCurve> curves;
    std::list<BezierCurve>::iterator it;
    static Point2 d[] = {   /*  Digitized points */
    { 591, 133 },
    { 586, 129 },
    { 577, 125 },
    { 564, 122 },
    { 554, 121 },
    { 546, 120 },
    { 532, 120 },
    { 516, 120 },
    { 503, 122 },
    { 493, 123 },
    { 481, 129 },
    { 474, 131 },
    { 466, 137 },
    { 461, 142 },
    { 453, 152 },
    { 451, 158 },
    { 446, 173 },
    { 443, 189 },
    { 442, 206 },
    { 442, 221 },
    { 443, 232 },
    { 451, 246 },
    { 482, 279 },
    { 523, 305 },
    { 572, 333 },
    { 614, 350 },
    { 631, 358 },
    { 641, 366 },
    { 645, 380 },
    { 648, 394 },
    { 648, 421 },
    { 617, 460 },
    { 566, 488 },
    { 475, 513 },
    { 380, 520 },
    { 294, 506 },
    { 256, 487 },

    };
    double  error = 4.0;        /*  Squared error */
    auto start = high_resolution_clock::now(); 
    curves  = FitCurve(d, 37, error);       /*  Fit the Bezier curves */
    auto end = high_resolution_clock::now(); 
    for (BezierCurve b : curves){
        // BezierCurve bez = curves[i];
        printf("%f,%f %f,%f %f,%f %f,%f\n", b[0].x, b[0].y, b[1].x, b[1].y, b[2].x, b[2].y, b[3].x, b[3].y);
    }
    printf("duration %lli\n", duration_cast<std::chrono::milliseconds>(end - start).count());
    // printf("duration %f", duration.count());
    free(&curves);
}
#endif                       /* TESTMODE */




int c_FitCurve(double *points, int nPts, double error, double *output){
    // Point2 *bloop = (Point2 *) points;
    // printf("Points:\n");
    // for(int i=0; i < nPts; i++){
    //     Point2 p = bloop[i];
    //     printf("%i: %f,%f\n",i, p.x, p.y);
        
    // }
    auto start = high_resolution_clock::now(); 
    std::list<BezierCurve> curves = FitCurve_Inflections( (Point2 *) points , nPts, error);
    auto end = high_resolution_clock::now(); 
    printf("duration %lli microseconds\n", duration_cast<std::chrono::microseconds>(end - start).count());
    
    // BezierCurve *out = (BezierCurve *) malloc(4 * sizeof(Point2) * curves.size());
    // BezierCurve *out = (BezierCurve *)output;
    int i = 0;
    // printf("Curves:\n");
    for (BezierCurve const &curve: curves) {
        BezierCurve b = curve;
        // printf("%f,%f %f,%f %f,%f %f,%f\n", b[0].x, b[0].y, b[1].x, b[1].y, b[2].x, b[2].y, b[3].x, b[3].y);
        std::memcpy(&output[i*8],curve,4 * sizeof(Point2));
        i++;
    }
    // std::copy(curves.begin(), curves.end(), out);
    return i;
}

void c_ML_EncodeCurves(double *curves, int nCurves, double *output){
    Point2 *p_curves = (Point2 *)curves;

    const int encoding_width = 9;
    for (int i=0; i < nCurves; i++) {
        Point2 p1 = p_curves[i*4];
        Point2 c1 = p_curves[i*4+1];
        Point2 c2 = p_curves[i*4+2];
        Point2 p2 = p_curves[i*4+3];
        // printf("p1 :%f %f\n, c1: %f %f\n c2: %f %f\n p2: %f %f\n" , p1.x,p1.y,c1.x,c1.y,c2.x,c2.y,p2.x,p2.y);

        double dx = p2.x-p1.x;
        double dy = p2.y-p1.y;
        double L = sqrt(dx * dx + dy * dy);
        double ndx = dx/L;
        double ndy = dy/L;

        double dc1x = c1.x - p1.x;
        double dc1y = c1.y - p1.y;
        double dc1L = sqrt(dc1x * dc1x + dc1y * dc1y);
        dc1x /= dc1L; dc1y /= dc1L;

        double dc2x = c2.x - p2.x;
        double dc2y = c2.y - p2.y;
        double dc2L = sqrt(dc2x * dc2x + dc2y * dc2y);
        dc2x /= dc2L; dc2y /= dc2L;

        double theta1 = asin(dc1x*ndy - dc1y*ndx);
        double theta2 = asin(dc2x*ndy - dc2y*ndx);

        double *out_i = &output[i*encoding_width];
        out_i[0] = p1.x;
        out_i[1] = p1.y;
        out_i[2] = dx;
        out_i[3] = dy;
        out_i[4] = theta1;
        out_i[5] = theta2;
        out_i[6] = dc1L;
        out_i[7] = dc2L;
        out_i[8] = 0; //penup / pendown?
        // printf("INDEX: %i\n",((int)out_i)>>3);
        // printf("v :%f %f\n, o: %f %f\n L: %f %f\n", dx, dy, theta1*(180/PI), theta2*(180/PI),dc1L,dc2L);

    }
}

// void c_InflectionPoints(double *d, int nPts){
//     std::list<int> inflections = InflectionPoints((Point2 *) d, nPts);
//     for (int const &inf: inflections) {
//         printf("Inflection %i\n", inf);
//     }
// }

std::list<BezierCurve> FitCurve_Inflections(Point2  *d, int nPts, double  error){
    std::list<BezierCurve> out = {};
    std::list<int> inflections = CurveAvgInflectionPoints((Point2 *) d, nPts);
    int prev = 0;
    std::list<int> last = {nPts-1};
    inflections.splice(inflections.end(),last);
    for (int const &inf: inflections) {
        std::list<BezierCurve> curve = FitCurve(&d[prev], inf-prev+1, error);
        out.splice(out.end(),curve);
        prev = inf;
    }
    return out;
}

/*
 *  FitCurve :
 *      Fit a Bezier curve to a set of digitized points 
 */
std::list<BezierCurve> FitCurve(Point2  *d, int nPts, double  error)
    // Point2   *d;         /*  Array of digitized points   */
    // int      nPts;       /*  Number of digitized points  */
    // double   error;      /*  User-defined error squared  */
{
    Vector2 tHat1, tHat2;   /*  Unit tangent vectors at endpoints */

    // std::list<BezierCurve> out = {};
    // std::list<int> inflections = InflectionPoints((Point2 *) d, nPts);
    // int prev = 0;
    // for (int const &inf: inflections) {
    //     tHat1 = ComputeLeftTangent(d, 0);
    //     tHat2 = ComputeRightTangent(d, nPts - 1);
    //     return FitCubic(d, 0, nPts - 1, tHat1, tHat2, error);
    //     prev = inf;
    // }

    tHat1 = ComputeLeftTangent(d, 0);
    tHat2 = ComputeRightTangent(d, nPts - 1);
    return FitCubic(d, 0, nPts - 1, tHat1, tHat2, error);
}

const int CONV_WIDTH = 5;
const double EPSILON = 1e-6;


// Point2 FindCenter(Point2 &p1, Point2 &p2, double angle){
//     // Vector2 diff = { p1.x-p0.x, p1.y-p0.y};
//     double dx = p1.x-p2.x;
//     double dy = p1.y-p2.y;
//     double s = sin(angle);
//     double c = cos(angle);
//     double L = sqrt(dx*dx + dy*dx);
//     double radius = (sin((PI-abs(angle))/2.0)/s)*L;
//     printf("RADIUS: %f %f %f\n", radius, sin(PI-angle/2.0),sin(angle));
//     double x = (p1.x + p2.x)/2.0 - radius*(dy/L)*c;
//     double y = (p1.y + p2.y)/2.0 + radius*(dx/L)*c;
//     Point2 out = {x,y};
//     printf("%f %f\n", p1.x,p1.y);
//     printf("%f %f\n", p2.x,p2.y);
//     printf("%f\n", angle);
//     printf("CENTER: %f %f\n", x,y);
//     return out;
// }

int AngleRegion(double angle){
    angle = angle + 22.5*(PI/180);
    if(angle < 0){angle += 2*PI;}
    if(angle >= 2*PI){angle -= 2*PI;}
    // printf("%f %f\n",angle, angle / (45*(PI/180)));
    return floor(angle / (45.0*(PI/180.0)));

}

double AngleDiff(double angle1, double angle2){
    double diff = angle1-angle2;
    if(diff < -PI){diff += 2*PI;}
    if(diff > PI){diff -= 2*PI;}
    return diff;
}

double RegionDiff(int region1, int region2){
    int diff = region1 - region2;
    if(diff < -4){diff += 8;}
    if(diff > 4){diff -= 8;}
    return diff;
}

const int STRIDE = 2;
std::list<int> CurveAvgInflectionPoints(Point2  *d,int nPts){
    printf("NPOINTS : %i\n", nPts);
    std::list<int> out = {};
    std::list<int> inf_list;

    // double *u = ChordLengthParameterize(d, 0, nPts);

    
    // double avgDiffAngle = 0.0;
    double totalAngle = 0.0;
    // double totalChord = 0.0;

    double start_ang;
    const int c = STRIDE;
    double  *angles = (double *)malloc((nPts-c) * sizeof(double));
    for(int i=0; i<nPts-c; i++){
        // printf("%i\n", i);
        // Point2 p0 = d[i-c];
        Point2 p1 = d[i];
        Point2 p2 = d[i+c];
        // printf("HERE1\n");
        // Vector2 diff1 = { p1.x-p0.x, p1.y-p0.y};
        // Vector2 diff2 = { p2.x-p1.x, p2.y-p1.y};
        Vector2 diff = { p2.x-p1.x, p2.y-p1.y};
        // V2Normalize(&diff1);
        // V2Normalize(&diff2);
        V2Normalize(&diff);
        // double cross = diff2.x*diff1.y - diff2.y * diff1.x;

        // double diff_ang = angles[i-c] = asin(cross);//atan2(diff.y,diff.x);
        angles[i] = atan2(diff.y,diff.x);
        // if(i==c){
            // start_ang = atan2(diff1.y,diff1.x);
        // }
        // printf("HERE1.5 %f \n", angles[i]*180/PI);
        // double chord = u[i];

    }

    double  *diffs = (double *)malloc((nPts-c) * sizeof(double));
    for(int i=1; i<nPts-c; i++){
        diffs[i] = AngleDiff(angles[i],angles[i-1]);
    }

    // double  *conv_angles = (double *)malloc((nPts-2-(CONV_WIDTH-1)) * sizeof(double));
    // const int c = (CONV_WIDTH-1)/2;
    // for(int i=c;i<nPts-2-c; i++){
    //     double conv_ang = 0.0;
    //     for(int j=-c;j<=c; j++){
    //         conv_ang += angles[i+j];
    //     }
    //     conv_angles[i-c] = conv_ang / CONV_WIDTH;
    //     printf("CONV ANGLES %i : %f\n",i-c,conv_angles[i-c]*(180/PI));
    // }

    // double totalAngle = 0.0;
    int inf = 0;
    int j_start = 0;
    int prevInfRegion = AngleRegion(angles[0]);
    int cw;
    double minAD = std::numeric_limits<double>::max();
    int minAD_i = -1;
    int start_mins = -1;
    int end_mins = -1;
    for(int i=1; i<nPts-c;i++){
        // totalAngle += angles[i-c];//* chord;
        double diff = AngleDiff(angles[inf],angles[i]);
        cw = diff > 0 ? 1 : -1;
        // diff = abs(diff)
        // int region1 = AngleRegion(angles[i-1]);
        int region = AngleRegion(angles[i]);

        // totalChord += chord;
        // printf("HERE1.55 %f %f\n", totalAngle, 90.0/(2.0*PI));
        // printf("ANGLE %f %f %f\n",(start_ang+totalAngle)*180/PI,totalAngle*180/PI, angles[i-1]*(180/PI));




        int rd = abs(RegionDiff(region,prevInfRegion));
        double ad = cw*AngleDiff(region*45*(PI/180),angles[i]);
        // printf("%i:ANGLE %f %f %i %i %f \n",i,angles[i]*(180/PI), diff*(180/PI), region , rd, ad*(180/PI));
        // printf("%i:CONDS %i %i %f %f\n", i, region , rd, ad*(180/PI),diffs[i]*(180/PI));

        // printf("%i:DIFF %f\n", i, diff*(180/PI));
        // if(i > 2 && AngleDiff(angles[i],angles[i-1]);)
        // double 
        // if(diff)
        if(i-inf>=3){
            // double diff = 
            double d0 = diffs[i];
            double d1 = diffs[i-1];
            double d2 = diffs[i-2];
            double dl = abs(d0) > abs(d2) ? d0 : d2;
            if(abs(d1+dl) > 70 * (PI/180)){
                // if(abs(d1) > abs(dl)){
                    inf  = i;
                    inf_list = {inf};
                    out.splice(out.end(), inf_list); 
                    int next = fmin(nPts-1,i+1);
                    prevInfRegion = AngleRegion(angles[next]);;
                    minAD = std::numeric_limits<double>::max();
                    minAD_i = -1;
                    start_mins = -1;
                    end_mins = -1;
                    // printf("BIG %i\n", inf); 
                    continue;
                // }
                
            }
        }

        if(abs(diff) > 30.0 * (PI/180) && (rd >= 1 && region % 2 == 0)){
            if(abs(ad)+rd*PI < minAD) {minAD_i = i;minAD = abs(ad)+rd*PI;}
            if(abs(ad) <= 5 * (PI/180) && start_mins == -1){start_mins = i;}                
            if(abs(ad) > 5 * (PI/180) && start_mins != -1){end_mins = i;}                
        }             
        if(rd >= 1){
            
            if(ad > 10 * (PI/180) || rd > 2){
                if(minAD_i != -1){
                    if(start_mins != -1 && end_mins != -1){
                        inf = ceil( (start_mins + end_mins)/2);
                        // printf("MINS : %i %i %i\n", start_mins,end_mins,inf);
                    }else{
                        inf = minAD_i;   
                        // printf("MIN %i\n", inf); 
                    }
                    inf_list = {inf};
                    out.splice(out.end(), inf_list); 
                    prevInfRegion = AngleRegion(angles[inf]);;
                    minAD = std::numeric_limits<double>::max();
                    minAD_i = -1;
                    start_mins = -1;
                    end_mins = -1;
                }
            }
        }
        // if(abs(angles[i-c])*(180/PI) > 45.0) {
        //     inf = i;
        //     inf_list = {inf};
        //     out.splice(out.end(), inf_list); 
        //     totalAngle = 0.0;
        // }

        // if(abs(totalAngle)*(180/PI) > 45.0){
        //     j_start = i;
        // }
        
        // if(abs(totalAngle)*(180/PI) > 90.0){
        //     // Point2 center = FindCenter(d[0],d[i],totalAngle);
            
        //     // printf("HERE1.6\n");
        //     // double maxDot = 0.0;
        //     // int j_start = inf;
        //     double minX = d[j_start].x;
        //     double maxX = d[j_start].x;
        //     double minY = d[j_start].y;
        //     double maxY = d[j_start].y;

        //     int minX_i = j_start;
        //     int maxX_i = j_start;
        //     int minY_i = j_start;
        //     int maxY_i = j_start;

        //     int m_i;

        //     // int max_j = 0;
        //     for(int j=j_start; j<=i+1; j++){
        //         Point2 p = d[j];
        //         if(p.x < minX){ minX = p.x; minX_i = j;}
        //         if(p.x > maxX){ maxX = p.x; maxX_i = j;}
        //         if(p.y < minY){ minY = p.y; minY_i = j;}
        //         if(p.y > maxY){ maxY = p.y; maxY_i = j;}
        //     }

        //     double minX_d = V2DistanceBetween2Points(&d[j_start],&d[minX_i]);
        //     double maxX_d = V2DistanceBetween2Points(&d[j_start],&d[maxX_i]);
        //     double minY_d = V2DistanceBetween2Points(&d[j_start],&d[minY_i]);
        //     double maxY_d = V2DistanceBetween2Points(&d[j_start],&d[maxY_i]);
        //     double md;
        //     inf = minX_i; md = std::numeric_limits<double>::max();
        //     if(minX_d < md){inf = minX_i; md = minX_d;}
        //     if(maxX_d < md){inf = maxX_i; md = maxX_d;}
        //     if(minY_d < md){inf = minY_i; md = minY_d;}
        //     if(maxY_d < md){inf = maxY_i; md = maxY_d;}

        //     printf("SQSH %f %f %f %f\n", minX_d, minY_d, maxX_d, maxY_d);

            

        //     // maxDot = dot;
        //     inf_list = {inf};
        //     out.splice(out.end(), inf_list); 




                

        //         // printf("%i %i %i\n", j, i,nPts);
        //         // printf("HERE1.7\n");
        //         // Point2 p = d[j];
        //         // Vector2 diff = { p.x-center.x, p.y-center.y};
        //         // V2Normalize(&diff);
        //         // double dx = p.x-center.x;
        //         // double dy = p.y-center.y;
        //         // Vector2
        //         // double dot = fmax(abs(diff.x),abs(diff.y));
        //         // if(dot > maxDot){
        //         //     maxDot = dot;
        //         //     max_j = j;
        //         // }
        //     // }
        //     totalAngle = 0.0;
        //     for(int j=inf; j<=i; j++){
        //         totalAngle += angles[j];
        //     }
        //     // start_ang = 
        //     printf("OUT TOTAL ANGLE %i %i %f\n",inf,i, totalAngle*180/PI);
        //     // i = minX_i-1;
        //     // printf("OUT: %i\n", max_j);
        //     // inf_i = {max_j};
        //     // out.splice(out.end(), inf_i); 
        //     // printf("HERE2\n" );
        // }
        // printf("HERE2.1\n");
    }
    // printf("RETURN\n");
    // for (int const &inf: out) {
    //     printf("Inflection %i\n", inf);
    // }
    // printf("RETURN2\n");
    free((void *)angles);
    free((void *)diffs);
    return out;
}

std::list<int> InflectionPoints(Point2  *d,int nPts){
    // double np = (double)nPts;
    // int conv_width = fmax(np * .05 , 5);
    // if(conv_width % 2 == 0){
    //     conv_width -= 1;
    // }
    // printf("conv_width %i, %f\n", conv_width,np * .05);
    double  *infs = (double *)malloc(nPts * sizeof(double));
    const int c = (CONV_WIDTH-1)/2;
    for(int i=0;i<c; i++){
        infs[i] = 0;
    }
    for(int i=c; i<nPts-c; i++){
        Point2 l = d[i-c];
        Point2 r = d[i+c];
        Point2 p = d[i];

        Vector2 ld = { l.x-p.x, l.y-p.y};
        Vector2 rd = { r.x-p.x, r.y-p.y};

        V2Normalize(&ld);
        V2Normalize(&rd);

        double x_inf = fmax(abs(ld.x + rd.x),EPSILON)/fmax(abs(ld.x) + abs(rd.x),1.0);
        double y_inf = fmax(abs(ld.y + rd.y),EPSILON)/fmax(abs(ld.y) + abs(rd.y),1.0);

        infs[i] = fmax(abs(x_inf-.1*y_inf),abs(y_inf-.1*x_inf));
    }
    for(int i=nPts-c;i<nPts; i++){
        infs[i] = 0;
    }

    // bool  *infs = (bool *)malloc(nPts * sizeof(bool));
    std::list<int> out = {};
    std::list<int> inf_i;
    int c2 = c*2;
    for(int i=c2; i<nPts-c2; i++){
        double max = 0.0;
        int max_i;
        for(int j=-c2; j<=c2; j++){
            // printf("%i\n", j);
            if(infs[i+j] > max){
                max = infs[i+j];
                max_i = i+j;
            }
        }
        double thresh = .5;
        if(max_i == i && infs[i] >= thresh){
            inf_i = {i};
            out.splice(out.end(), inf_i); 
        }
        printf("%f %i\n", infs[i],max_i == i && infs[i] >= thresh);
    }
    return out;

}



/*
 *  FitCubic :
 *      Fit a Bezier curve to a (sub)set of digitized points
 */
static std::list<BezierCurve> FitCubic(Point2 *d, int first, int last,  Vector2 tHat1, Vector2 tHat2, double error)
    // Point2   *d;         /*  Array of digitized points */
    // int      first, last;    /* Indices of first and last pts in region */
    // Vector2  tHat1, tHat2;   /* Unit tangent vectors at endpoints */
    // double   error;      /*  User-defined error squared     */
{
    BezierCurve bezCurve; /*Control points of fitted Bezier curve*/
    double  *u;     /*  Parameter values for point  */
    double  *uPrime;    /*  Improved parameter values */
    double  maxError;   /*  Maximum fitting error    */
    int     splitPoint; /*  Point to split point set at  */
    int     nPts;       /*  Number of points in subset  */
    double  iterationError; /*Error below which you try iterating  */
    int     maxIterations = 4; /*  Max times to try iterating  */
    Vector2 tHatCenter;     /* Unit tangent vector at splitPoint */
    int     i;      

    iterationError = error * 4.0;   /* fixed issue 23 */
    nPts = last - first + 1;

    /*  Use heuristic if region only has two points in it */
    if (nPts == 2) {
        double dist = V2DistanceBetween2Points(&d[last], &d[first]) / 3.0;

        bezCurve = (Point2 *)malloc(4 * sizeof(Point2));
        bezCurve[0] = d[first];
        bezCurve[3] = d[last];
        V2Add(&bezCurve[0], V2Scale(&tHat1, dist), &bezCurve[1]);
        V2Add(&bezCurve[3], V2Scale(&tHat2, dist), &bezCurve[2]);
        // DrawBezierCurve(3, bezCurve);
        // free((void *)bezCurve);

        std::list<BezierCurve> out = { bezCurve };
        return out;
    }

    /*  Parameterize points, and attempt to fit curve */
    u = ChordLengthParameterize(d, first, last);
    bezCurve = GenerateBezier(d, first, last, u, tHat1, tHat2);

    /*  Find max deviation of points to fitted curve */
    maxError = ComputeMaxError(d, first, last, bezCurve, u, &splitPoint);
    if (maxError < error) {
        // DrawBezierCurve(3, bezCurve);
        std::list<BezierCurve> out = { bezCurve };
        free((void *)u);
        // free((void *)bezCurve);
        return out;
    }


    /*  If error not too large, try some reparameterization  */
    /*  and iteration */
    if (maxError < iterationError) {
        for (i = 0; i < maxIterations; i++) {
            uPrime = Reparameterize(d, first, last, u, bezCurve);
            free((void *)bezCurve);
            bezCurve = GenerateBezier(d, first, last, uPrime, tHat1, tHat2);
            maxError = ComputeMaxError(d, first, last,
                       bezCurve, uPrime, &splitPoint);
            if (maxError < error) {
            // DrawBezierCurve(3, bezCurve);
            free((void *)u);
            // free((void *)bezCurve);
            free((void *)uPrime);

            std::list<BezierCurve> out = { bezCurve };
            return out;
        }
        free((void *)u);
        u = uPrime;
    }
    }

    /* Fitting failed -- split at max error point and fit recursively */
    free((void *)u);
    // free((void *)bezCurve);
    tHatCenter = ComputeCenterTangent(d, splitPoint);

    std::list<BezierCurve> left = FitCubic(d, first, splitPoint, tHat1, tHatCenter, error);
    V2Negate(&tHatCenter);
    std::list<BezierCurve> right = FitCubic(d, splitPoint, last, tHatCenter, tHat2, error);

    left.splice(left.end(), right);
    return left;
}


/*
 *  GenerateBezier :
 *  Use least-squares method to find Bezier control points for region.
 *
 */
static BezierCurve  GenerateBezier(Point2   *d, int first, int last, double *uPrime, Vector2 tHat1, Vector2 tHat2)
    // Point2   *d;         /*  Array of digitized points   */
    // int      first, last;        /*  Indices defining region */
    // double   *uPrime;        /*  Parameter values for region */
    // Vector2  tHat1, tHat2;   /*  Unit tangents at endpoints  */
{
    int     i;
    Vector2     A[MAXPOINTS][2];    /* Precomputed rhs for eqn  */
    int     nPts;           /* Number of pts in sub-curve */
    double  C[2][2];            /* Matrix C     */
    double  X[2];           /* Matrix X         */
    double  det_C0_C1,      /* Determinants of matrices */
            det_C0_X,
            det_X_C1;
    double  alpha_l,        /* Alpha values, left and right */
            alpha_r;
    Vector2     tmp;            /* Utility variable     */
    BezierCurve bezCurve;   /* RETURN bezier curve ctl pts  */
    double  segLength;
    double  epsilon;

    bezCurve = (Point2 *)malloc(4 * sizeof(Point2));
    nPts = last - first + 1;

 
    /* Compute the A's  */
    for (i = 0; i < nPts; i++) {
        Vector2     v1, v2;
        v1 = tHat1;
        v2 = tHat2;
        V2Scale(&v1, B1(uPrime[i]));
        V2Scale(&v2, B2(uPrime[i]));
        A[i][0] = v1;
        A[i][1] = v2;
    }

    /* Create the C and X matrices  */
    C[0][0] = 0.0;
    C[0][1] = 0.0;
    C[1][0] = 0.0;
    C[1][1] = 0.0;
    X[0]    = 0.0;
    X[1]    = 0.0;

    for (i = 0; i < nPts; i++) {
        C[0][0] += V2Dot(&A[i][0], &A[i][0]);
        C[0][1] += V2Dot(&A[i][0], &A[i][1]);
/*                  C[1][0] += V2Dot(&A[i][0], &A[i][1]);*/ 
        C[1][0] = C[0][1];
        C[1][1] += V2Dot(&A[i][1], &A[i][1]);

        tmp = V2SubII(d[first + i],
            V2AddII(
              V2ScaleIII(d[first], B0(uPrime[i])),
                V2AddII(
                    V2ScaleIII(d[first], B1(uPrime[i])),
                            V2AddII(
                            V2ScaleIII(d[last], B2(uPrime[i])),
                                V2ScaleIII(d[last], B3(uPrime[i]))))));
    

    X[0] += V2Dot(&A[i][0], &tmp);
    X[1] += V2Dot(&A[i][1], &tmp);
    }

    /* Compute the determinants of C and X  */
    det_C0_C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1];
    det_C0_X  = C[0][0] * X[1]    - C[1][0] * X[0];
    det_X_C1  = X[0]    * C[1][1] - X[1]    * C[0][1];

    /* Finally, derive alpha values */
    alpha_l = (det_C0_C1 == 0) ? 0.0 : det_X_C1 / det_C0_C1;
    alpha_r = (det_C0_C1 == 0) ? 0.0 : det_C0_X / det_C0_C1;

    /* If alpha negative, use the Wu/Barsky heuristic (see text) */
    /* (if alpha is 0, you get coincident control points that lead to
     * divide by zero in any subsequent NewtonRaphsonRootFind() call. */
    segLength = V2DistanceBetween2Points(&d[last], &d[first]);
    epsilon = 1.0e-6 * segLength;
    if (alpha_l < epsilon || alpha_r < epsilon)
    {
        /* fall back on standard (probably inaccurate) formula, and subdivide further if needed. */
        double dist = segLength / 3.0;
        bezCurve[0] = d[first];
        bezCurve[3] = d[last];
        V2Add(&bezCurve[0], V2Scale(&tHat1, dist), &bezCurve[1]);
        V2Add(&bezCurve[3], V2Scale(&tHat2, dist), &bezCurve[2]);
        return (bezCurve);
    }

    /*  First and last control points of the Bezier curve are */
    /*  positioned exactly at the first and last data points */
    /*  Control points 1 and 2 are positioned an alpha distance out */
    /*  on the tangent vectors, left and right, respectively */
    bezCurve[0] = d[first];
    bezCurve[3] = d[last];
    V2Add(&bezCurve[0], V2Scale(&tHat1, alpha_l), &bezCurve[1]);
    V2Add(&bezCurve[3], V2Scale(&tHat2, alpha_r), &bezCurve[2]);
    return (bezCurve);
}


/*
 *  Reparameterize:
 *  Given set of points and their parameterization, try to find
 *   a better parameterization.
 *
 */
static double *Reparameterize(Point2 *d, int first, int last, double *u, BezierCurve bezCurve)
    // Point2   *d;         /*  Array of digitized points   */
    // int      first, last;        /*  Indices defining region */
    // double   *u;         /*  Current parameter values    */
    // BezierCurve  bezCurve;   /*  Current fitted curve    */
{
    int     nPts = last-first+1;    
    int     i;
    double  *uPrime;        /*  New parameter values    */

    uPrime = (double *)malloc(nPts * sizeof(double));
    for (i = first; i <= last; i++) {
        uPrime[i-first] = NewtonRaphsonRootFind(bezCurve, d[i], u[i-
                    first]);
    }
    return (uPrime);
}



/*
 *  NewtonRaphsonRootFind :
 *  Use Newton-Raphson iteration to find better root.
 */
static double NewtonRaphsonRootFind(BezierCurve Q,Point2 P,double u)
    // BezierCurve  Q;          /*  Current fitted curve    */
    // Point2       P;      /*  Digitized point     */
    // double       u;      /*  Parameter value for "P" */
{
    double      numerator, denominator;
    Point2      Q1[3], Q2[2];   /*  Q' and Q''          */
    Point2      Q_u, Q1_u, Q2_u; /*u evaluated at Q, Q', & Q''  */
    double      uPrime;     /*  Improved u          */
    int         i;
    
    /* Compute Q(u) */
    Q_u = BezierII(3, Q, u);
    
    /* Generate control vertices for Q' */
    for (i = 0; i <= 2; i++) {
        Q1[i].x = (Q[i+1].x - Q[i].x) * 3.0;
        Q1[i].y = (Q[i+1].y - Q[i].y) * 3.0;
    }
    
    /* Generate control vertices for Q'' */
    for (i = 0; i <= 1; i++) {
        Q2[i].x = (Q1[i+1].x - Q1[i].x) * 2.0;
        Q2[i].y = (Q1[i+1].y - Q1[i].y) * 2.0;
    }
    
    /* Compute Q'(u) and Q''(u) */
    Q1_u = BezierII(2, Q1, u);
    Q2_u = BezierII(1, Q2, u);
    
    /* Compute f(u)/f'(u) */
    numerator = (Q_u.x - P.x) * (Q1_u.x) + (Q_u.y - P.y) * (Q1_u.y);
    denominator = (Q1_u.x) * (Q1_u.x) + (Q1_u.y) * (Q1_u.y) +
                  (Q_u.x - P.x) * (Q2_u.x) + (Q_u.y - P.y) * (Q2_u.y);
    if (denominator == 0.0f) return u;

    /* u = u - f(u)/f'(u) */
    uPrime = u - (numerator/denominator);
    return (uPrime);
}

    
               
/*
 *  Bezier :
 *      Evaluate a Bezier curve at a particular parameter value
 * 
 */
static Point2 BezierII(int degree, Point2 *V, double t)
    // int      degree;     /* The degree of the bezier curve   */
    // Point2   *V;     /* Array of control points      */
    // double   t;      /* Parametric value to find point for   */
{
    int     i, j;       
    Point2  Q;          /* Point on curve at parameter t    */
    Point2  *Vtemp;     /* Local copy of control points     */

    /* Copy array   */
    Vtemp = (Point2 *)malloc((unsigned)((degree+1) 
                * sizeof (Point2)));
    for (i = 0; i <= degree; i++) {
        Vtemp[i] = V[i];
    }

    /* Triangle computation */
    for (i = 1; i <= degree; i++) { 
        for (j = 0; j <= degree-i; j++) {
            Vtemp[j].x = (1.0 - t) * Vtemp[j].x + t * Vtemp[j+1].x;
            Vtemp[j].y = (1.0 - t) * Vtemp[j].y + t * Vtemp[j+1].y;
        }
    }

    Q = Vtemp[0];
    free((void *)Vtemp);
    return Q;
}


/*
 *  B0, B1, B2, B3 :
 *  Bezier multipliers
 */
static double B0(double u)
    // double   u;
{
    double tmp = 1.0 - u;
    return (tmp * tmp * tmp);
}


static double B1(double u)
    // double   u;
{
    double tmp = 1.0 - u;
    return (3 * u * (tmp * tmp));
}

static double B2(double u)
    // double   u;
{
    double tmp = 1.0 - u;
    return (3 * u * u * tmp);
}

static double B3(double u)
    // double   u;
{
    return (u * u * u);
}



/*
 * ComputeLeftTangent, ComputeRightTangent, ComputeCenterTangent :
 *Approximate unit tangents at endpoints and "center" of digitized curve
 */
static Vector2 ComputeLeftTangent(Point2 *d, int end)
    // Point2   *d;         /*  Digitized points*/
    // int      end;        /*  Index to "left" end of region */
{
    Vector2 tHat1;
    tHat1 = V2SubII(d[end+1], d[end]);
    tHat1 = *V2Normalize(&tHat1);
    return tHat1;
}

static Vector2 ComputeRightTangent(Point2 *d, int end)
    // Point2   *d;         /*  Digitized points        */
    // int      end;        /*  Index to "right" end of region */
{
    Vector2 tHat2;
    tHat2 = V2SubII(d[end-1], d[end]);
    tHat2 = *V2Normalize(&tHat2);
    return tHat2;
}


static Vector2 ComputeCenterTangent(Point2 *d, int center)
    // Point2   *d;         /*  Digitized points            */
    // int      center;     /*  Index to point inside region    */
{
    Vector2 V1, V2, tHatCenter;

    V1 = V2SubII(d[center-1], d[center]);
    V2 = V2SubII(d[center], d[center+1]);
    tHatCenter.x = (V1.x + V2.x)/2.0;
    tHatCenter.y = (V1.y + V2.y)/2.0;
    tHatCenter = *V2Normalize(&tHatCenter);
    return tHatCenter;
}


/*
 *  ChordLengthParameterize :
 *  Assign parameter values to digitized points 
 *  using relative distances between points.
 */
static double *ChordLengthParameterize(Point2 *d, int first, int last)
    // Point2   *d;         /* Array of digitized points */
    // int      first, last;        /*  Indices defining region */
{
    int     i;  
    double  *u;         /*  Parameterization        */

    u = (double *)malloc((unsigned)(last-first+1) * sizeof(double));

    u[0] = 0.0;
    for (i = first+1; i <= last; i++) {
        u[i-first] = u[i-first-1] +
                V2DistanceBetween2Points(&d[i], &d[i-1]);
    }

    for (i = first + 1; i <= last; i++) {
        u[i-first] = u[i-first] / u[last-first];
    }

    return(u);
}




/*
 *  ComputeMaxError :
 *  Find the maximum squared distance of digitized points
 *  to fitted curve.
*/
static double ComputeMaxError(Point2 *d, int first, int last, BezierCurve bezCurve, double *u, int *splitPoint)
    // Point2   *d;         /*  Array of digitized points   */
    // int      first, last;        /*  Indices defining region */
    // BezierCurve  bezCurve;       /*  Fitted Bezier curve     */
    // double   *u;         /*  Parameterization of points  */
    // int      *splitPoint;        /*  Point of maximum error  */
{
    int     i;
    double  maxDist;        /*  Maximum error       */
    double  dist;       /*  Current error       */
    Point2  P;          /*  Point on curve      */
    Vector2 v;          /*  Vector from point to curve  */

    *splitPoint = (last - first + 1)/2;
    maxDist = 0.0;
    for (i = first + 1; i < last; i++) {
        P = BezierII(3, bezCurve, u[i-first]);
        v = V2SubII(P, d[i]);
        dist = V2SquaredLength(&v);
        if (dist >= maxDist) {
            maxDist = dist;
            *splitPoint = i;
        }
    }
    return (maxDist);
}
static Vector2 V2AddII(Vector2 a, Vector2 b)
    // Vector2 a, b;
{
    Vector2 c;
    c.x = a.x + b.x;  c.y = a.y + b.y;
    return (c);
}
static Vector2 V2ScaleIII(Vector2 v,double s)
    // Vector2  v;
    // double   s;
{
    Vector2 result;
    result.x = v.x * s; result.y = v.y * s;
    return (result);
}

static Vector2 V2SubII(Vector2 a, Vector2 b)
    // Vector2  a, b;
{
    Vector2 c;
    c.x = a.x - b.x; c.y = a.y - b.y;
    return (c);
}